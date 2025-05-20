import fetch from "node-fetch";
import { format } from "date-fns";

// Muftyat.kz Namaz API response interface
interface MuftyatPrayerTimesResponse {
  // New format from namaz.muftyat.kz
  date: string;
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  // Times array for the original API format
  times?: {
    fadjr: string;
    sunrise: string;
    dhuhr: string;
    asr: string;
    maghrib: string;
    isha: string;
  }[];
}

// Simplified prayer times interface
export interface PrayerTimes {
  fajr: string;
  sunrise: string;
  zuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  midnight: string; // We'll calculate an approximate midnight
  date: string;
}

// Interface for Muftyat.kz cities API response
export interface City {
  id: number;
  title: string;
  lng: string;
  lat: string;
  timezone: string;
  region: string;
  district: string | null;
}

// Response format from the Muftyat.kz API
export interface CitiesResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: City[];
}

// Get prayer times from Muftyat.kz API using coordinates
export async function getPrayerTimes(latitude: number, longitude: number, date: Date): Promise<PrayerTimes> {
  try {
    // Format the full date for returning in the result
    const formattedDate = format(date, "dd-MM-yyyy");
    
    // Format API date parameter (expected by the API)
    const apiDate = format(date, "yyyy-MM-dd");
    
    // Construct the URL for the Muftyat.kz API using the namaz endpoint
    const url = `https://namaz.muftyat.kz/kk/namaz/api/times/?latitude=${latitude}&longitude=${longitude}&date=${apiDate}`;
    
    console.log(`Fetching prayer times from: ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch prayer times: ${response.statusText}`);
    }
    
    const data = await response.json() as MuftyatPrayerTimesResponse;
    
    console.log("Received prayer times data:", JSON.stringify(data));
    
    // Calculate approximate midnight (5 hours after maghrib as an approximation)
    let midnight = "00:00";
    try {
      midnight = addHoursToTime(data.maghrib, 5);
    } catch (e) {
      console.warn("Could not calculate midnight, using default:", e);
    }
    
    // Convert to our simplified format
    return {
      fajr: formatTime(data.fajr),
      sunrise: formatTime(data.sunrise),
      zuhr: formatTime(data.dhuhr),
      asr: formatTime(data.asr),
      maghrib: formatTime(data.maghrib),
      isha: formatTime(data.isha),
      midnight: formatTime(midnight),
      date: formattedDate
    };
  } catch (error) {
    console.error("Error fetching prayer times:", error);
    throw error;
  }
}

// Get prayer times by city ID
export async function getPrayerTimesByCity(cityId: string, date: Date): Promise<PrayerTimes> {
  try {
    // Find the city in our database to get its coordinates
    // For now, we'll just get the coordinates from the API and use that with getPrayerTimes
    
    // Format the full date for returning in the result
    const formattedDate = format(date, "dd-MM-yyyy");
    
    // Format the API date parameter
    const apiDate = format(date, "yyyy-MM-dd");
    
    // Use the coordinates endpoint to get city coordinates
    const cityDataUrl = `https://api.muftyat.kz/cities/${cityId}/`;
    
    console.log(`Getting city data from: ${cityDataUrl}`);
    
    try {
      const cityResponse = await fetch(cityDataUrl);
      
      if (!cityResponse.ok) {
        throw new Error(`Failed to get city data: ${cityResponse.statusText}`);
      }
      
      const cityData = await cityResponse.json() as City;
      
      if (!cityData.lat || !cityData.lng) {
        throw new Error(`City data does not contain coordinates for city ID ${cityId}`);
      }
      
      console.log(`Found coordinates for city ${cityId}: lat=${cityData.lat}, lng=${cityData.lng}`);
      
      // Now use getPrayerTimes with the city's coordinates
      return getPrayerTimes(parseFloat(cityData.lat), parseFloat(cityData.lng), date);
      
    } catch (cityError) {
      console.error(`Error getting city data: ${cityError}`);
      throw cityError;
    }
  } catch (error) {
    console.error("Error fetching prayer times for city:", error);
    throw error;
  }
}

// Get available cities from Muftyat.kz API
export async function getCities(): Promise<CitiesResponse> {
  try {
    const url = 'https://api.muftyat.kz/cities';
    console.log(`Fetching cities from: ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch cities: ${response.statusText}`);
    }
    
    const data = await response.json() as CitiesResponse;
    return data;
  } catch (error) {
    console.error("Error fetching cities:", error);
    throw error;
  }
}

// Helper function to get day of year (1-366)
function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

// Format time to HH:MM format
function formatTime(timeStr: string): string {
  // Ensure time is in HH:MM format
  const timeParts = timeStr.split(':');
  if (timeParts.length >= 2) {
    return `${timeParts[0].padStart(2, '0')}:${timeParts[1].padStart(2, '0')}`;
  }
  return timeStr;
}

// Calculate midnight as midpoint between maghrib and next day's fajr
function calculateMidnight(maghrib: string, nextFajr: string): string {
  // Convert times to minutes since midnight
  const maghribMinutes = timeToMinutes(maghrib);
  let fajrMinutes = timeToMinutes(nextFajr);
  
  // If fajr is earlier (which it should be), add 24 hours (1440 minutes)
  if (fajrMinutes < maghribMinutes) {
    fajrMinutes += 1440;
  }
  
  // Midpoint in minutes
  const midpointMinutes = Math.floor((maghribMinutes + fajrMinutes) / 2) % 1440;
  
  // Convert back to HH:MM format
  const hours = Math.floor(midpointMinutes / 60);
  const minutes = midpointMinutes % 60;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

// Convert time string (HH:MM) to minutes since midnight
function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

// Add hours to a time string
function addHoursToTime(timeStr: string, hoursToAdd: number): string {
  const minutes = timeToMinutes(timeStr);
  const newMinutes = (minutes + hoursToAdd * 60) % 1440;
  
  const hours = Math.floor(newMinutes / 60);
  const mins = newMinutes % 60;
  
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}