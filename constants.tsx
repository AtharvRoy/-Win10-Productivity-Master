
import React from 'react';
import { FolderNode, SetupStep } from './types';

export const FOLDER_STRUCTURE: FolderNode[] = [
  {
    name: "01_Academic",
    isTopLevel: true,
    description: "Active school and exam prep material",
    subfolders: [
      { 
        name: "JEE_2027", 
        subfolders: [
          { name: "Physics" },
          { name: "Chemistry" },
          { name: "Math" },
          { name: "Trackers_Schedules" }
        ]
      },
      { name: "School_Projects" },
      { name: "Assignments_Pending" }
    ]
  },
  {
    name: "02_Resources",
    isTopLevel: true,
    description: "Reference material that rarely changes",
    subfolders: [
      { name: "Question_Papers" },
      { name: "Digital_Textbooks" },
      { name: "Formula_Sheets" },
      { name: "Video_Lectures" }
    ]
  },
  {
    name: "03_Personal",
    isTopLevel: true,
    description: "Non-academic life management",
    subfolders: [
      { name: "Finance_Scholarships" },
      { name: "Identity_Docs" },
      { name: "Health_Medical" },
      { name: "Hobbies" }
    ]
  },
  {
    name: "04_Media",
    isTopLevel: true,
    description: "Visual and creative assets",
    subfolders: [
      { name: "Photos" },
      { name: "Videos" },
      { name: "Wallpapers_Icons" }
    ]
  },
  {
    name: "05_Archive",
    isTopLevel: true,
    description: "Completed work and old files",
    subfolders: [
      { name: "Previous_Grades" },
      { name: "Completed_Projects" }
    ]
  },
  {
    name: "99_Inbox",
    isTopLevel: true,
    description: "The 'Temporary' landing zone for unsorted files"
  }
];

export const SETUP_STEPS: SetupStep[] = [
  {
    id: "clean-desktop",
    category: "Desktop",
    title: "The Zero-Icon Desktop",
    description: "Your desktop is a workspace, not a storage unit.",
    details: [
      "Create a folder named 'Desktop_Cleanup_Date' on your desktop.",
      "Move EVERY single file and folder into this new folder.",
      "Right-click Desktop -> View -> Uncheck 'Show desktop icons'.",
      "Pin only your 3 most used apps to the Taskbar.",
      "Move the 'Desktop_Cleanup' folder to '99_Inbox' for sorting later."
    ]
  },
  {
    id: "clean-downloads",
    category: "Downloads",
    title: "Taming the Downloads Folder",
    description: "Empty your downloads daily to prevent 'Digital Rust'.",
    details: [
      "Open Downloads. Sort by 'Date Modified'.",
      "Delete everything you don't recognize or haven't opened in 30 days.",
      "Move academic PDFs to '02_Resources/Question_Papers' or 'Digital_Textbooks'.",
      "Move personal photos to '04_Media/Photos'.",
      "Goal: The Downloads folder should be EMPTY by the end of the day."
    ]
  },
  {
    id: "quick-access",
    category: "QuickAccess",
    title: "The Quick Access Shortcut",
    description: "Navigate like a pro with sidebar pinning.",
    details: [
      "Go to your Documents -> 01_Academic.",
      "Right-click the folder -> Select 'Pin to Quick Access'.",
      "Repeat for '02_Resources' and '99_Inbox'.",
      "Unpin 'Recent folders' from Quick Access settings to reduce clutter."
    ]
  }
];
