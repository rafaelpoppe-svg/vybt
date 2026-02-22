/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AddStory from './pages/AddStory';
import Ambassador from './pages/Ambassador';
import Chat from './pages/Chat';
import CreatePlan from './pages/CreatePlan';
import EditProfile from './pages/EditProfile';
import Explore from './pages/Explore';
import Friends from './pages/Friends';
import GroupChat from './pages/GroupChat';
import Home from './pages/Home';
import Moderation from './pages/Moderation';
import MyPlans from './pages/MyPlans';
import MyStories from './pages/MyStories';
import NotificationSettings from './pages/NotificationSettings';
import Notifications from './pages/Notifications';
import Onboarding from './pages/Onboarding';
import PlanDetails from './pages/PlanDetails';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import StoryView from './pages/StoryView';
import UserProfile from './pages/UserProfile';
import WelcomePrograms from './pages/WelcomePrograms';
import Welcome from './pages/Welcome';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AddStory": AddStory,
    "Ambassador": Ambassador,
    "Chat": Chat,
    "CreatePlan": CreatePlan,
    "EditProfile": EditProfile,
    "Explore": Explore,
    "Friends": Friends,
    "GroupChat": GroupChat,
    "Home": Home,
    "Moderation": Moderation,
    "MyPlans": MyPlans,
    "MyStories": MyStories,
    "NotificationSettings": NotificationSettings,
    "Notifications": Notifications,
    "Onboarding": Onboarding,
    "PlanDetails": PlanDetails,
    "Profile": Profile,
    "Settings": Settings,
    "StoryView": StoryView,
    "UserProfile": UserProfile,
    "WelcomePrograms": WelcomePrograms,
    "Welcome": Welcome,
}

export const pagesConfig = {
    mainPage: "Onboarding",
    Pages: PAGES,
    Layout: __Layout,
};