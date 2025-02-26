// scripts/helpers.js

// Example array of your project data.
// Each entry can have as many fields as you like (title, date, languages, GitHub links, images, etc.)
const projectsData = [
  {
    id: 1,
    title: "Webcam Painter (Dartmouth CS10)",
    description: `
      <p>A Java-based application that uses region growing (flood fill) to detect a target color in webcam video
      and "paint" it onto a separate canvas. Built for Dartmouth's CS10 course.</p>
      <ul>
        <li><strong>Key Concepts:</strong> Object-Oriented Programming, Image Processing, Real-time Video Capture</li>
        <li><strong>Languages:</strong> Java</li>
        <li><strong>Tags:</strong> OOP, Region Flood Fill, Webcam</li>
      </ul>
      <p><em>Screenshot placeholder goes here (or multiple). Mark below where to embed an image from <code>/images/project_screenshots</code>.</em></p>
    `,
    // If you want to store code snippets, you could embed them or link to GitHub:
    codeSnippets: [
      {
        fileName: "RegionsTest.java",
        snippetUrl: "#", // Link to raw GitHub Gist or custom code viewer
      },
      {
        fileName: "RegionFinder.java",
        snippetUrl: "#",
      },
      {
        fileName: "CamPaint.java",
        snippetUrl: "#",
      }
    ]
  },
  {
    id: 2,
    title: "Static Landing Page (HTML/CSS Only)",
    description: `
      <p>A notion-inspired landing page focusing on HTML semantics and basic CSS layout.
      Emulates structural elements from a modern homepage, responsive down to mobile sizes.</p>
      <ul>
        <li><strong>Key Concepts:</strong> Semantic HTML5, Responsive CSS</li>
        <li><strong>Languages:</strong> HTML, CSS</li>
      </ul>
      <p><em>Again, mark where to place a screenshot in <code>/images/project_screenshots</code> if desired.</em></p>
    `,
    codeSnippets: [
      {
        fileName: "index.html",
        snippetUrl: "#"
      },
      {
        fileName: "style.css",
        snippetUrl: "#"
      }
    ]
  }
];

// Optional helper function to return all projects
function getAllProjects() {
  return projectsData;
}

// Optional helper to retrieve a single project by ID
function getProjectById(id) {
  return projectsData.find((proj) => proj.id === id);
}

// Export (if you use ES modules). Or just keep them in global scope.
window.getAllProjects = getAllProjects;
window.getProjectById = getProjectById;
