import React from 'react';

import projectsData from '../../data/projects.json';

export const ProjectsViewer: React.FC = () => {
    return (
        <div className="projects-viewer" style={{ padding: 10, backgroundColor: '#fff', height: '100%', overflowY: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                {projectsData.map((proj) => (
                    <div key={proj.id} className="project-card" style={{ border: '1px solid #808080', padding: 5, boxShadow: '1px 1px #000' }}>
                        <h4 style={{ margin: '0 0 5px 0' }}>{proj.title}</h4>
                        <p style={{ margin: '0 0 10px 0', fontSize: '0.9em' }}>{proj.description}</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {proj.tags.map(tag => (
                                <span key={tag} style={{ fontSize: '0.8em', backgroundColor: '#e0e0e0', padding: '1px 3px', border: '1px solid #808080' }}>
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
