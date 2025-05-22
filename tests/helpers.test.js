const { getAllProjects, getProjectById } = require('../scripts/helpers.js');

describe('helpers', () => {
  test('getAllProjects returns all projects', () => {
    const projects = getAllProjects();
    expect(Array.isArray(projects)).toBe(true);
    expect(projects.length).toBe(2);
    expect(projects[0].id).toBe(1);
    expect(projects[1].id).toBe(2);
  });

  test('getProjectById returns correct project', () => {
    const project = getProjectById(1);
    expect(project).toBeDefined();
    expect(project.title).toBe('Webcam Painter (Dartmouth CS10)');
  });

  test('getProjectById returns undefined for invalid id', () => {
    const project = getProjectById(999);
    expect(project).toBeUndefined();
  });
});
