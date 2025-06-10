import React from 'react';
import axios from 'axios';

const ModuleList = ({ modules, onEdit, onRefresh }) => {
    const handleDelete = async (id) => {
        if (window.confirm('Delete this module?')) {
            try {
                await axios.delete(`/api/modules/${id}`);
                onRefresh();
            } catch (error) {
                console.error('Delete failed:', error);
            }
        }
    };

    const togglePublish = async (module) => {
        try {
            await axios.patch(`/api/modules/${module.id}/publish`, {
                published: !module.published
            });
            onRefresh();
        } catch (error) {
            console.error('Toggle publish failed:', error);
        }
    };

    return (
        <div className="space-y-4">
            {modules.map((module) => (
                <div key={module.id} className="border p-4 rounded shadow-sm">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-semibold">
                            {module.title}
                            <span className={`ml-2 text-sm px-2 py-1 rounded-full ${module.published ? 'bg-green-200 text-green-800' : 'bg-yellow-100 text-yellow-700'}`}>
                                {module.published ? 'Published' : 'Unpublished'}
                            </span>
                        </h3>
                    </div>
                    <p className="mt-2">{module.description}</p>
                    {/* Display lecturer name if available */}
                    {module.lecturer_name && (
                        <p className="text-gray-600 text-sm mt-1">Lecturer: {module.lecturer_name}</p>
                    )}
                    <div className="mt-3 space-x-2">
                        <button
                            onClick={() => onEdit(module)}
                            className="bg-blue-500 text-white px-3 py-1 rounded"
                        >
                            Edit
                        </button>
                        <button
                            onClick={() => handleDelete(module.id)}
                            className="bg-red-500 text-white px-3 py-1 rounded"
                        >
                            Delete
                        </button>
                        <button
                            onClick={() => togglePublish(module)}
                            className="bg-gray-500 text-white px-3 py-1 rounded"
                        >
                            {module.published ? 'Unpublish' : 'Publish'}
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ModuleList;