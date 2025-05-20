import fetch from "node-fetch";
import { format } from "date-fns";

// Muftyat.kz API response interface
interface MuftyatPrayerTimesResponse {
  times: {
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
  name: string;
  name_kz: string;
  name_ru: string;
  lat: number;
  lng: number;
  elevation: number;
}

// Get prayer times from Muftyat.kz API using coordinates
export async function getPrayerTimes(latitude: number, longitude: number, date: Date): Promise<PrayerTimes> {
  try {
    // Format the year
    const year = format(date, "yyyy");
    
    // Format the full date for returning in the result
    const formattedDate = format(date, "dd-MM-yyyy");
    
    // Construct the URL for the Muftyat.kz API
    const url = `https://api.muftyat.kz/prayer-times/${year}/${latitude}/${longitude}`;
    
    console.log(`Fetching prayer times from: ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch prayer times: ${response.statusText}`);
    }
    
    const data = await response.json() as MuftyatPrayerTimesResponse;
    
    // Find the prayer times for the requested date
    // The API returns times for the whole year, so we need to find the correct day
    const dayOfYear = getDayOfYear(date);
    const dayData = data.times[dayOfYear - 1]; // Adjust for 0-indexed array
    
    if (!dayData) {
      throw new Error(`No prayer times found for ${formattedDate}`);
    }
    
    // Calculate approximate midnight (midpoint between maghrib and fajr of next day)
    // If it's the last day of the year, use approximate fixed midnight
    let midnight = "00:00";
    try {
      if (dayOfYear < data.times.length) {
        const nextDayFajr = data.times[dayOfYear].fadjr;
        midnight = calculateMidnight(dayData.maghrib, nextDayFajr);
      } else {
        // For the last day of the year, use maghrib + 5 hours as an approximation
        midnight = addHoursToTime(dayData.maghrib, 5);
      }
    } catch (e) {
      console.warn("Could not calculate midnight, using default:", e);
    }
    
    // Convert to simplified format
    return {
      fajr: formatTime(dayData.fadjr),
      sunrise: formatTime(dayData.sunrise),
      zuhr: formatTime(dayData.dhuhr),
      asr: formatTime(dayData.asr),
      maghrib: formatTime(dayData.maghrib),
      isha: formatTime(dayData.isha),
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
    // Format the year
    const year = format(date, "yyyy");
    
    // Format the full date for returning in the result
    const formattedDate = format(date, "dd-MM-yyyy");
    
    // Construct the URL for the Muftyat.kz API with city ID
    const url = `https://api.muftyat.kz/prayer-times/${year}/city/${cityId}`;
    
    console.log(`Fetching prayer times for city ID ${cityId} from: ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch prayer times: ${response.statusText}`);
    }
    
    const data = await response.json() as MuftyatPrayerTimesResponse;
    
    // Find the prayer times for the requested date
    // The API returns times for the whole year, so we need to find the correct day
    const dayOfYear = getDayOfYear(date);
    const dayData = data.times[dayOfYear - 1]; // Adjust for 0-indexed array
    
    if (!dayData) {
      throw new Error(`No prayer times found for ${formattedDate}`);
    }
    
    // Calculate approximate midnight (midpoint between maghrib and fajr of next day)
    // If it's the last day of the year, use approximate fixed midnight
    let midnight = "00:00";
    try {
      if (dayOfYear < data.times.length) {
        const nextDayFajr = data.times[dayOfYear].fadjr;
        midnight = calculateMidnight(dayData.maghrib, nextDayFajr);
      } else {
        // For the last day of the year, use maghrib + 5 hours as an approximation
        midnight = addHoursToTime(dayData.maghrib, 5);
      }
    } catch (e) {
      console.warn("Could not calculate midnight, using default:", e);
    }
    
    // Convert to simplified format
    return {
      fajr: formatTime(dayData.fadjr),
      sunrise: formatTime(dayData.sunrise),
      zuhr: formatTime(dayData.dhuhr),
      asr: formatTime(dayData.asr),
      maghrib: formatTime(dayData.maghrib),
      isha: formatTime(dayData.isha),
      midnight: formatTime(midnight),
      date: formattedDate
    };
  } catch (error) {
    console.error("Error fetching prayer times:", error);
    throw error;
  }
}

// Get available cities from Muftyat.kz API
export async function getCities(): Promise<City[]> {
  try {
    const url = 'https://api.muftyat.kz/cities';
    console.log(`Fetching cities from: ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch cities: ${response.statusText}`);
    }
    
    const cities = await response.json() as City[];
    return cities;
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
