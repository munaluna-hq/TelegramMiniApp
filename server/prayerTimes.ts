import fetch from "node-fetch";
import { format } from "date-fns";

// Aladhan API response interface
interface AladhanPrayerTimesResponse {
  code: number;
  status: string;
  data: {
    timings: {
      Fajr: string;
      Sunrise: string;
      Dhuhr: string;
      Asr: string;
      Maghrib: string;
      Isha: string;
      Midnight: string;
    };
    date: {
      readable: string;
      timestamp: string;
      gregorian: {
        date: string;
        format: string;
        day: string;
        month: {
          number: number;
          en: string;
        };
        year: string;
      };
    };
    meta: {
      latitude: number;
      longitude: number;
      timezone: string;
      method: {
        id: number;
        name: string;
      };
    };
  };
}

// Simplified prayer times interface
export interface PrayerTimes {
  fajr: string;
  sunrise: string;
  zuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  midnight: string;
  date: string;
}

// Interface for city data
export interface City {
  id: number;
  title: string;
  lng: string;
  lat: string;
  timezone: string;
  region: string;
  district: string | null;
}

// Response format for cities API
export interface CitiesResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: City[];
}

// Get prayer times from Aladhan API using coordinates
export async function getPrayerTimes(latitude: number, longitude: number, date: Date): Promise<PrayerTimes> {
  try {
    // Format the full date for returning in the result
    const formattedDate = format(date, "dd-MM-yyyy");
    
    // Format API date parameter expected by Aladhan API (DD-MM-YYYY)
    const apiDate = format(date, "dd-MM-yyyy");
    
    // Use calculation method 2 (Islamic Society of North America)
    const method = 2;
    
    // Construct the URL for the Aladhan API
    const url = `https://api.aladhan.com/v1/timings/${apiDate}?latitude=${latitude}&longitude=${longitude}&method=${method}`;
    
    console.log(`Fetching prayer times from: ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch prayer times: ${response.statusText}`);
    }
    
    const data = await response.json() as AladhanPrayerTimesResponse;
    
    console.log("Received prayer times data from Aladhan API");
    
    // Convert to our simplified format, removing 'AM'/'PM' and converting to 24-hour format
    return {
      fajr: formatTime(data.data.timings.Fajr),
      sunrise: formatTime(data.data.timings.Sunrise),
      zuhr: formatTime(data.data.timings.Dhuhr),
      asr: formatTime(data.data.timings.Asr),
      maghrib: formatTime(data.data.timings.Maghrib),
      isha: formatTime(data.data.timings.Isha),
      midnight: formatTime(data.data.timings.Midnight),
      date: formattedDate
    };
  } catch (error) {
    console.error("Error fetching prayer times:", error);
    throw error;
  }
}

// Get prayer times by city ID using local database of cities
export async function getPrayerTimesByCity(cityId: string, date: Date): Promise<PrayerTimes> {
  try {
    // For now, we'll use our existing city database and get coordinates
    
    // Format the full date for returning in the result
    const formattedDate = format(date, "dd-MM-yyyy");
    
    // Try to get city data from our database
    // This is a simplified version - you'll need to adapt based on your actual city data storage
    
    try {
      // Get city coordinates from your database
      // For demonstration, we'll use a simpler approach
      // In a real implementation, you'd query your database for this info
      
      // If you have a getCityById function in your DB storage module, use that
      
      // Example with hardcoded cities for demonstration
      const cities: {[key: string]: {lat: string, lng: string, name: string}} = {
        "1": { lat: "51.1801", lng: "71.446", name: "Astana" },
        "2": { lat: "43.2567", lng: "76.9286", name: "Almaty" },
        "3": { lat: "42.3417", lng: "69.5901", name: "Shymkent" }
      };
      
      const cityData = cities[cityId];
      
      if (!cityData) {
        throw new Error(`City data not found for city ID ${cityId}`);
      }
      
      console.log(`Using coordinates for city ${cityId}: lat=${cityData.lat}, lng=${cityData.lng}`);
      
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

// Get available cities - now using our local database instead of the Muftyat API
export async function getCities(): Promise<CitiesResponse> {
  try {
    // This would normally fetch cities from an API, but we'll return a static list
    // of major cities for Kazakhstan and nearby regions
    const staticCities: City[] = [
      { id: 1, title: "Astana", lng: "71.446", lat: "51.1801", timezone: "Asia/Almaty", region: "Akmola", district: null },
      { id: 2, title: "Almaty", lng: "76.9286", lat: "43.2567", timezone: "Asia/Almaty", region: "Almaty", district: null },
      { id: 3, title: "Shymkent", lng: "69.5901", lat: "42.3417", timezone: "Asia/Almaty", region: "South Kazakhstan", district: null },
      { id: 4, title: "Aktobe", lng: "57.1684", lat: "50.2797", timezone: "Asia/Almaty", region: "Aktobe", district: null },
      { id: 5, title: "Karaganda", lng: "73.1015", lat: "49.8019", timezone: "Asia/Almaty", region: "Karaganda", district: null },
      { id: 6, title: "Taraz", lng: "71.3587", lat: "42.9019", timezone: "Asia/Almaty", region: "Jambyl", district: null },
      { id: 7, title: "Pavlodar", lng: "76.9549", lat: "52.2873", timezone: "Asia/Almaty", region: "Pavlodar", district: null },
      { id: 8, title: "Ust-Kamenogorsk", lng: "82.6173", lat: "49.9714", timezone: "Asia/Almaty", region: "East Kazakhstan", district: null },
      { id: 9, title: "Semey", lng: "80.2274", lat: "50.4265", timezone: "Asia/Almaty", region: "East Kazakhstan", district: null },
      { id: 10, title: "Atyrau", lng: "51.8966", lat: "47.0945", timezone: "Asia/Almaty", region: "Atyrau", district: null }
    ];
    
    console.log(`Returning ${staticCities.length} cities from local database`);
    
    return {
      count: staticCities.length,
      next: null,
      previous: null,
      results: staticCities
    };
  } catch (error) {
    console.error("Error getting cities:", error);
    throw error;
  }
}

// Format time to HH:MM format from Aladhan API's HH:MM (or HH:MM AM/PM) format
function formatTime(timeStr: string): string {
  // First, check if the time has AM/PM indicator and convert to 24-hour format
  if (timeStr.includes('AM') || timeStr.includes('PM')) {
    return convert12hTo24h(timeStr);
  }
  
  // Otherwise, just ensure proper formatting of HH:MM
  const timeParts = timeStr.split(':');
  if (timeParts.length >= 2) {
    return `${timeParts[0].padStart(2, '0')}:${timeParts[1].padStart(2, '0')}`;
  }
  return timeStr;
}

// Convert 12-hour time format (with AM/PM) to 24-hour format
function convert12hTo24h(timeStr: string): string {
  // Remove any spaces
  timeStr = timeStr.trim();
  
  // Extract the time and AM/PM indicator
  const isPM = timeStr.toUpperCase().includes('PM');
  const timeOnly = timeStr.replace(/\s*[AP]M\s*/i, '');
  
  // Split into hours and minutes
  const [hoursStr, minutesStr] = timeOnly.split(':');
  let hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);
  
  // Convert to 24-hour format
  if (isPM && hours < 12) {
    hours += 12;
  } else if (!isPM && hours === 12) {
    hours = 0;
  }
  
  // Format and return
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