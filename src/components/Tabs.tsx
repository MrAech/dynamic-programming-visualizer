import React, { useState, useEffect, Children, isValidElement } from 'react';

interface TabsProps {
  children: React.ReactNode;
  defaultTab: string;
  onTabChange?: (tabId: string) => void;
  activeTab?: string;
}

interface TabProps {
  id: string;
  title: string;
  children: React.ReactNode;
}

export const Tab: React.FC<TabProps> = ({ children }) => {
  return <>{children}</>;
};

export const Tabs: React.FC<TabsProps> = ({ children, defaultTab, onTabChange, activeTab: externalActiveTab }) => {
  const [activeTab, setActiveTab] = useState(defaultTab);

  // Sync with external activeTab changes
  useEffect(() => {
    if (externalActiveTab !== undefined) {
      setActiveTab(externalActiveTab);
    }
  }, [externalActiveTab]);

  const tabs = Children.toArray(children).filter(isValidElement) as React.ReactElement<TabProps>[];

  const activeContent = tabs.find(child => child.props.id === activeTab);

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    onTabChange?.(tabId);
  };

  return (
    <div className="tabs-container">
      <div className="tabs-list">
        {tabs.map(child => (
          <button
            key={child.props.id}
            className={`tab-btn ${activeTab === child.props.id ? 'active' : ''}`}
            onClick={() => handleTabClick(child.props.id)}
          >
            {child.props.title}
          </button>
        ))}
      </div>
      <div className="tab-content">
        {activeContent}
      </div>
    </div>
  );
};
