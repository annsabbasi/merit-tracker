# Merit Tracker System

Merit Tracker is a comprehensive employee performance management system built with Next.js that enables companies to track, manage, and reward employee productivity through a merit-based points system. The application features department management, project tracking, task assignment, screen monitoring, quality control review, and a competitive leaderboard system.

## Features

1. **Company & User Management**
   - Company registration with unique company codes
   - User registration linked to company codes
   - Automatic user assignment to respective companies

2. **Department & Project Organization**
   - Create and manage multiple departments (Engineering, Design, etc.)
   - Project creation within departments
   - Hierarchical project structure for better organization

3. **Task Management**
   - Create subtasks within projects
   - Assign tasks to individual users or teams
   - Collaborative work on sub-projects
   - Task submission and review workflow

4. **Screen Monitoring & Time Tracking**
   - Desktop application for screen capturing
   - Mandatory installation for time tracking
   - Real-time activity monitoring while working on projects

5. **Quality Control System**
   - QC Admin review process for submitted tasks
   - Merit points allocation based on task quality
   - Task approval workflow

6. **Additional Features**
   - SOPs section for uploading documents, videos, and images
   - Notification system for task updates
   - Leaderboard for gamified performance tracking
   - My Tasks dashboard for personal task management
   - Chat system module (in development)
   - User profile management
   - Settings and preferences

## Tech Stack

### Frontend
- **Framework:** Next.js 16.0.10
- **UI Library:** React 19.2.0
- **State Management:** Zustand 5.0.9
- **Data Fetching:** TanStack React Query 5.90.12
- **Form Handling:** React Hook Form 7.60.0 with Zod validation
- **Styling:** Tailwind CSS 4.1.9
- **UI Components:** Shadcn/UI with Radix UI primitives
- **Icons:** Lucide React
- **Date Handling:** date-fns
- **Charts:** Recharts
- **HTTP Client:** Axios 1.13.2
- **Package Manager:** pnpm

### Desktop Application
- **Electron App** for screen monitoring and time tracking

## Project Structure
```
merit-tracker/
├── .next/                    # Next.js build output
├── app/                      # Next.js app directory
│   ├── (auth)/              # Authentication routes
│   ├── dashboard/           # Main dashboard routes
│   │   ├── departments/     # Department management
│   │   ├── leaderboard/     # Performance leaderboard
│   │   ├── manage/          # Administrative management
│   │   ├── my-tasks/        # Personal task dashboard
│   │   ├── notifications/   # Notification center
│   │   ├── profile/         # User profile
│   │   ├── projects/        # Project management
│   │   ├── qc-review/       # Quality control review
│   │   ├── screen-monitoring/ # Screen tracking
│   │   ├── settings/        # Application settings
│   │   ├── sops/            # Standard operating procedures
│   │   ├── layout.tsx       # Dashboard layout
│   │   └── page.tsx         # Dashboard home
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Landing page
├── components/              # Reusable React components
├── hooks/                   # Custom React hooks
├── lib/                     # Utility functions and libraries
├── node_modules/            # Dependencies
├── public/                  # Static assets
├── styles/                  # Additional stylesheets
├── .env                     # Environment variables
├── .gitignore              # Git ignore rules
├── components.json         # Shadcn UI configuration
├── middleware.ts           # Next.js middleware
├── next.config.mjs         # Next.js configuration
├── package.json            # Project dependencies
├── pnpm-lock.yaml          # pnpm lock file
├── postcss.config.mjs      # PostCSS configuration
└── tsconfig.json           # TypeScript configuration
```

## Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- pnpm package manager
- Desktop application (Electron) for screen monitoring

### Frontend Setup

1. **Clone the repository:**
```bash
git clone <repository-url>
cd merit-tracker
```

2. **Install dependencies:**
```bash
pnpm install
```

3. **Create environment file:**
```bash
cp .env.example .env
```

4. **Configure environment variables:**

Open `.env` and add your configuration:
```env
# Add your environment variables here
NEXT_PUBLIC_API_URL=your_api_url
# Add other required variables
```

5. **Start the development server:**
```bash
pnpm dev
```

The application should now be running at `http://localhost:3000`

### Build for Production
```bash
pnpm build
```
```bash
pnpm start
```

### Desktop Application Setup

1. **Download and install the Electron desktop application**
2. **Launch the desktop app before starting time tracking**
3. **Ensure the app is running in the background during work sessions**

## Running the Application

1. **Start the frontend development server:**
```bash
pnpm dev
```

2. **Launch the desktop monitoring application**

3. **Access the application:**
   - Open your browser and navigate to `http://localhost:3000`
   - Register your company or log in with company code
   - Install the desktop app for screen monitoring

## Application Workflow

### For Company Admins:
1. Register company and receive unique company code
2. Create departments (Engineering, Design, etc.)
3. Create projects within departments
4. Manage users and assign roles
5. Review QC submissions and allocate merit points

### For Employees:
1. Register using company code
2. Install desktop monitoring application
3. View assigned tasks in "My Tasks"
4. Create and work on subtasks
5. Track time with screen monitoring active
6. Submit completed tasks for QC review
7. Earn merit points and compete on leaderboard

### Quality Control Process:
1. Employee submits completed task
2. Task appears in QC Admin review queue
3. QC Admin reviews submission
4. Points allocated based on quality
5. Task marked as approved/revision needed
6. Points reflected on leaderboard

## Key Dependencies
```json
{
  "@tanstack/react-query": "^5.90.12",
  "zustand": "^5.0.9",
  "react-hook-form": "^7.60.0",
  "zod": "3.25.76",
  "axios": "^1.13.2",
  "next": "16.0.10",
  "react": "19.2.0",
  "tailwindcss": "^4.1.9"
}
```

## Features in Development

- Chat system module for team communication
- Advanced analytics and reporting
- Mobile application support
- Enhanced notification system
- Integration with third-party tools

## Technologies Used

✔ **Next.js 16** - React Framework  
✔ **React 19** - UI Library  
✔ **TypeScript** - Type Safety  
✔ **TanStack Query** - Server State Management  
✔ **Zustand** - Client State Management  
✔ **Tailwind CSS** - Styling  
✔ **Shadcn/UI** - Component Library  
✔ **Radix UI** - Headless UI Components  
✔ **React Hook Form** - Form Management  
✔ **Zod** - Schema Validation  
✔ **Axios** - HTTP Client  
✔ **Electron** - Desktop Application  
✔ **pnpm** - Package Manager  

## Troubleshooting

### If the development server doesn't start:
```bash
rm -rf node_modules pnpm-lock.yaml
```
```bash
pnpm install
```
```bash
pnpm dev
```

### If you encounter build errors:
```bash
pnpm run build --debug
```

## Desktop Application

**Note:** The desktop application for screen monitoring is not open source and is provided separately. 

If you need access to the desktop application or have questions about obtaining the screen monitoring software, please contact the project maintainers directly.

## Contributing

If you'd like to contribute to Merit Tracker:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/improvement`)
3. Make your changes
4. Commit your changes (`git commit -am 'Add new feature'`)
5. Push to the branch (`git push origin feature/improvement`)
6. Create a Pull Request

## License

<<<<<<< HEAD
[Add your license information here]
=======
This project is licensed under the [MIT License](./LICENSE).
>>>>>>> b3e8f3dfbd723f8a7c3fa7c18143581ba633e0cd

## Support

For support and questions, please [add contact information or issue tracker link]

---

**Important:** Make sure to install and run the desktop monitoring application before starting any time-tracked work sessions. The screen monitoring feature is essential for accurate time tracking and productivity measurement.
