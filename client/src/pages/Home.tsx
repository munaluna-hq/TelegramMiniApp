import { useState } from "react";
import Layout from "@/components/Layout";
import Calendar from "@/components/Calendar";
import DailyTracker from "@/components/DailyTracker";
import Settings from "@/components/Settings";

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>("calendar");

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === "calendar" && <Calendar />}
      {activeTab === "tracker" && <DailyTracker />}
      {activeTab === "settings" && <Settings />}
    </Layout>
  );
}
