import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { AlbumPlayer } from './pages/AlbumPlayer';
import { AIChatEditor } from './pages/AIChatEditor';
import { Onboarding } from './pages/Onboarding';
import { PhotoSelector } from './pages/PhotoSelector';
import { AIProcessing } from './pages/AIProcessing';
import { Profile } from './pages/Profile';
import { Collaborate } from './pages/Collaborate';

export const App: React.FC = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/album/:id" element={<AlbumPlayer />} />
          <Route path="/editor" element={<AIChatEditor />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/create" element={<PhotoSelector />} />
          <Route path="/processing" element={<AIProcessing />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/collaborate" element={<Collaborate />} />
        </Routes>
      </Layout>
    </Router>
  );
};
export default App;
