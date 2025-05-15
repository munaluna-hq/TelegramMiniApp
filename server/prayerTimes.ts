import fetch from "node-fetch";
import { format } from "date-fns";

// Prayer times response interface
interface PrayerTimesResponse {
  code: number;
  status: string;
  data: {
    timings: {
      Fajr: string;
      Sunrise: string;
      Dhuhr: string;
      Asr: string;
      Sunset: string;
      Maghrib: string;
      Isha: string;
      Imsak: string;
      Midnight: string;
    };
    date: {
      readable: string;
      timestamp: string;
      hijri: any;
      gregorian: any;
    };
    meta: {
      latitude: number;
      longitude: number;
      timezone: string;
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

// Get prayer times from AlAdhan.com API
export async function getPrayerTimes(latitude: number, longitude: number, date: Date): Promise<PrayerTimes> {
  try {
    const formattedDate = format(date, "dd-MM-yyyy");
    
    const url = `https://api.aladhan.com/v1/timings/${formattedDate}?latitude=${latitude}&longitude=${longitude}&method=2`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch prayer times: ${response.statusText}`);
    }
    
    const data = await response.json() as PrayerTimesResponse;
    
    // Convert to simplified format with 24-hour time
    return {
      fajr: data.data.timings.Fajr.substring(0, 5),
      sunrise: data.data.timings.Sunrise.substring(0, 5),
      zuhr: data.data.timings.Dhuhr.substring(0, 5),
      asr: data.data.timings.Asr.substring(0, 5),
      maghrib: data.data.timings.Maghrib.substring(0, 5),
      isha: data.data.timings.Isha.substring(0, 5),
      midnight: data.data.timings.Midnight.substring(0, 5),
      date: formattedDate
    };
  } catch (error) {
    console.error("Error fetching prayer times:", error);
    throw error;
  }
}
