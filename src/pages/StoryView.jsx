import React from 'react';
import { useNavigate } from 'react-router-dom';
import StoryViewContent from '../components/story/StoryViewContent';

// StoryView as a standalone page — reads storyId from URL params
export default function StoryView() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const storyId = urlParams.get('id');

  return <StoryViewContent initialStoryId={storyId} onClose={() => navigate(-1)} />;
}