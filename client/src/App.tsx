import { useEffect, useState } from 'react';
import axios from 'axios';
import Monaco from '@monaco-editor/react';

type Entity = {
  table_name: string;
  columns: {
    column_name: string;
    data_type: string;
  },
  relationships: {
    related_table: string;
    relationship_type: string;
  }
}

const App = () => {
  const [savedEntities, setSavedEntities] = useState<Entity[]>([]);
  
  const [userInput, setUserInput] = useState('');
  const [parsedEntities, setParsedEntities] = useState('');
  const [loadedEntities, setLoadedEntities] = useState('');
  const [gptLoading, setGptLoading] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL;

  const getSavedEntities = async () => {
    try {
      const { data } = await axios.get(`${apiUrl}/entities`);

      setSavedEntities(data ?? []);
    } catch (error) {
      console.error('Error fetching saved entities:', error);
      alert('Failed to get saved entities.');
    }
  }

  const handleSendToGpt = async () => {
    if (!userInput?.length) {
      alert('Input SQL query.');
      return;
    }

    setGptLoading(true);
    try {
      const response = await axios.post(`${apiUrl}/gpt/parse-entity`, {
        prompt: userInput,
      });
      setParsedEntities(JSON.stringify(response.data, null, 2));  // Format JSON response
    } catch (error) {
      console.error('Error calling GPT API:', error);
    } finally {
      setGptLoading(false);
    }
  };

  const handleSaveEntities = async (jsonEntities: string) => {
    try {
      const parsedStructures = JSON.parse(jsonEntities);
      await axios.post(`${apiUrl}/entities/`, parsedStructures);
      alert('Entities saved successfully!');

      getSavedEntities();
    } catch (error) {
      console.error('Error saving response:', error);
      alert('Failed to save the response.');
    }
  };

  const showSavedEntity = (index: number) => {
    setLoadedEntities(JSON.stringify({
      tables: [savedEntities[index]],
    }, null, 2))
  }

  const deleteSavedEntity = async (entityTableName: string) => {
    await axios.delete(`${apiUrl}/entities/${entityTableName}`);
    alert(`Entity "${entityTableName}" was deleted successfully!`);

    getSavedEntities();
  }

  useEffect(() => {
    getSavedEntities();
  }, []);

  return (
    <div style={{ padding: '2rem', maxHeight: '100%' }}>
      <h1>DB STRUCTURE PARSER</h1>

      <div style={{ marginBottom: '1rem' }}>
        <label>Enter your SQL query:</label>
        <div style={{ marginTop: '0.5rem' }}>
          <Monaco
              height="400px"  // Adjust height based on your needs
              language="sql"  // Set language to JSON for IntelliSense
              value={userInput}  // The JSON data to edit
              onChange={(newValue) => setUserInput(newValue || '')}  // Update state on change
              options={{
                minimap: { enabled: false },  // Disable minimap
                automaticLayout: true,  // Auto adjust layout
              }}
            />
        </div>
      </div>

      <button onClick={handleSendToGpt} style={{ marginBottom: '1rem' }} disabled={gptLoading}>
        {gptLoading ? 'Loading...' : 'Send to GPT'}
      </button>

      <div style={{ marginBottom: '1rem' }}>
        <label>Parsed Entities</label>
        <div style={{ marginTop: '0.5rem' }}>
          <Monaco
            height="400px"  // Adjust height based on your needs
            language="json"  // Set language to JSON for IntelliSense
            value={parsedEntities}  // The JSON data to edit
            onChange={(newValue) => setParsedEntities(newValue || '')}  // Update state on change
            options={{
              minimap: { enabled: false },  // Disable minimap
              automaticLayout: true,  // Auto adjust layout
            }}
          />
        </div>
      </div>

      <button onClick={() => handleSaveEntities(parsedEntities)} style={{ marginBottom: '1rem' }}>Save Entities</button>

      {!!savedEntities.length && (
        <>
          <hr />
          <h2>Saved Entities</h2>



          <div style={{ marginTop: '1rem' }}>
            {savedEntities.map((entity, index) => (
              <div
                className='saved-entity'
                key={`${entity.table_name}-${index}`}
                onClick={() => showSavedEntity(index)}
              >
                <div style={{marginRight: '1rem'}}>{entity.table_name}</div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSavedEntity(entity.table_name)
                  }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>
            <Monaco
              height="400px"  // Adjust height based on your needs
              language="json"  // Set language to JSON for IntelliSense
              value={loadedEntities}  // The JSON data to edit
              onChange={(newValue) => setParsedEntities(newValue || '')}  // Update state on change
              options={{
                minimap: { enabled: false },  // Disable minimap
                automaticLayout: true,  // Auto adjust layout
              }}
            />
          </div>

          <button onClick={() => handleSaveEntities(loadedEntities)} style={{ marginBottom: '1rem' }}>Resave Entity</button>
        </>
      )}
    </div>
  );
};

export default App;
