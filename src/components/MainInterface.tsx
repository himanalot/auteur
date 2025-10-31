import React from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { setActiveTab } from '../store/appSlice';
import AIAssistantTab from './tabs/AIAssistantTab';
import ManualToolTestTab from './tabs/ManualToolTestTab';
import ScriptGeneratorTab from './tabs/ScriptGeneratorTab';
import ScriptRunnerTab from './tabs/ScriptRunnerTab';
import AIChatTab from './tabs/AIChatTab';
import SimpleChatTab from './tabs/SimpleChatTab';
import VideoListTab from './tabs/VideoListTab';
import AutonomousAgentTab from './tabs/AutonomousAgentTab';
import FreshAutonomousTab from './tabs/FreshAutonomousTab';
import ProcessedVideoTab from './tabs/ProcessedVideoTab';
import RAGTab from './tabs/RAGTab';
import VideoChatTab from './tabs/VideoChatTab';
import OriginalScriptGeneratorTab from './tabs/OriginalScriptGeneratorTab';
import ScriptTestTab from './tabs/ScriptTestTab';
import SAM2VideoMaskingTab from './tabs/SAM2VideoMaskingTab';
import SAM2WorkingTab from './tabs/SAM2WorkingTab';
import SAM2CppTab from './tabs/SAM2CppTab';
import SAM2ActualTab from './tabs/SAM2ActualTab';
import SAM2CustomMaskTab from './tabs/SAM2CustomMaskTab';
import SAM2VideoMaskTab from './tabs/SAM2VideoMaskTab';
import ProjectGraphTab from './tabs/ProjectGraphTab';

const MainInterface: React.FC = () => {
  const dispatch = useAppDispatch();
  const activeTab = useAppSelector((state) => state.app.activeTab);

  const tabs = [
    { id: 'ai', label: 'AI Assistant', component: AIAssistantTab },
    { id: 'manual', label: 'Manual Tool Test', component: ManualToolTestTab },
    { id: 'script', label: 'Script Generator', component: ScriptGeneratorTab },
    { id: 'runner', label: 'Script Runner', component: ScriptRunnerTab },
    { id: 'original-script', label: '🎬 Original Script Gen', component: OriginalScriptGeneratorTab },
    { id: 'chat', label: 'AI Chat', component: AIChatTab },
    { id: 'simple-chat', label: 'Simple Chat', component: SimpleChatTab },
    { id: 'video-list', label: '🎬 Video List', component: VideoListTab },
    { id: 'autonomous', label: '🤖 Autonomous Agent', component: AutonomousAgentTab },
    { id: 'fresh-autonomous', label: '🚀 Fresh Autonomous', component: FreshAutonomousTab },
    { id: 'processed-video', label: '🎬 Processed Video', component: ProcessedVideoTab },
    { id: 'video', label: 'Video Chat', component: VideoChatTab },
    { id: 'rag', label: 'AE Docs RAG', component: RAGTab },
    { id: 'script-test', label: '🧪 Script Test', component: ScriptTestTab },
    { id: 'sam2-masking', label: '🎭 SAM2 Video Masking', component: SAM2VideoMaskingTab },
    { id: 'sam2-working', label: '✅ SAM2 Working', component: SAM2WorkingTab },
    { id: 'sam2-cpp', label: '🚀 SAM2 C++', component: SAM2CppTab },
    { id: 'sam2-actual', label: '🧠 SAM2 ACTUAL', component: SAM2ActualTab },
    { id: 'sam2-custom', label: '🎭 SAM2 CUSTOM', component: SAM2CustomMaskTab },
    { id: 'sam2-video', label: '🎬 SAM2 VIDEO', component: SAM2VideoMaskTab },
    { id: 'project-graph', label: '🕸️ Project Graph', component: ProjectGraphTab },
  ];

  const handleTabClick = (tabId: string) => {
    dispatch(setActiveTab(tabId));
  };

  const renderActiveTab = () => {
    const activeTabData = tabs.find(tab => tab.id === activeTab);
    if (activeTabData) {
      const Component = activeTabData.component;
      return <Component />;
    }
    return null;
  };

  return (
    <div id="content">
      <div className="section">
        <div className="tab-container">
          <div className="tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => handleTabClick(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        
        <div className="tab-content-container">
          {renderActiveTab()}
        </div>
      </div>
    </div>
  );
};

export default MainInterface;