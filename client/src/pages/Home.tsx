import { useState } from "react";
import Layout from "@/components/Layout";
import Calendar from "@/components/Calendar";
import DailyTracker from "@/components/DailyTracker";
import Settings from "@/components/Settings";
import PrayerTimes from "@/components/PrayerTimes";

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>("calendar");

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === "calendar" && (
        <div className="space-y-4 p-4">
          <PrayerTimes />
          <div className="mt-6">
            <Calendar />
          </div>
        </div>
      )}
      {activeTab === "tracker" && <DailyTracker />}
      {activeTab === "settings" && <Settings />}
    </Layout>
  );
}
