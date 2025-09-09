import React, { useState } from 'react';
// import Prospects from './Prospects';
import KnowledgeBase from './components/KnowledgeBase.tsx';
import { ChevronDown, ChevronLeft } from "lucide-react";
// import Sequence from './Sequence';
// import Analytics from './Analytics';
import Setting from './components/Settings';

const tabs = ['Prospects', 'Knowledge Base', 'Sequence', 'Analytics', 'Setting'];

interface TabNavigationProps {
  tabs: string[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({ tabs, activeTab, setActiveTab }) => {
  return (
    <div className="flex space-x-6 border-b border-gray-200">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`pb-2 text-sm font-medium ${
            activeTab === tab
              ? 'border-b-2 border-purple-600 text-purple-600'
              : 'text-gray-500 hover:text-black'
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
};

const CampaignLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('Knowledge Base');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Prospects':
        // return <Prospects />;
      case 'Knowledge Base':
        return <KnowledgeBase />;
      case 'Sequence':
        // return <Sequence />;
      case 'Analytics':
        // return <Analytics />;
      case 'Setting':
        return <Setting />;
      default:
        return null;
    }
  };

  return (
    <div className="p-2.5 flex flex-col">
        <div className="text-lg py-3 font-medium inline-flex items-center">
          <ChevronLeft className="w-5 h-5 mr-2 opacity-70"/>
          <span className="mr-2 text-xl">Yellow_Cold Mails</span>
          <span className="bg-green-100 text-green-500 text-xs px-2 py-0.5 rounded-md inline-flex items-center">
            Active
            <ChevronDown className="w-3 h-3 ml-1" />
          </span>
        </div>

      <TabNavigation tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="mt-4">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default CampaignLayout;
