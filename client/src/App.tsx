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
  const [entities, setEntities] = useState('');
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
      setEntities(JSON.stringify(response.data, null, 2));  // Format JSON response
    } catch (error) {
      console.error('Error calling GPT API:', error);
    } finally {
      setGptLoading(false);
    }
  };

  const handleSaveEntities = async () => {
    try {
      const parsedStructure = JSON.parse(entities);  // Parse the JSON before sending
      await axios.post(`${apiUrl}/entities/save`, parsedStructure);
      alert('Response saved successfully!');

      getSavedEntities();
    } catch (error) {
      console.error('Error saving response:', error);
      alert('Failed to save the response.');
    }
  };

  const showSavedEntity = (index: number) => {
    setEntities(JSON.stringify({
      tables: [savedEntities[index]],
    }, null, 2))
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
        <label>Entity</label>
        <div style={{ marginTop: '0.5rem' }}>
          <Monaco
            height="400px"  // Adjust height based on your needs
            language="json"  // Set language to JSON for IntelliSense
            value={entities}  // The JSON data to edit
            onChange={(newValue) => setEntities(newValue || '')}  // Update state on change
            options={{
              minimap: { enabled: false },  // Disable minimap
              automaticLayout: true,  // Auto adjust layout
            }}
          />
        </div>
      </div>

      <button onClick={handleSaveEntities} style={{ marginBottom: '1rem' }}>Save Entity</button>
      {!!savedEntities.length && (
        <>
          <hr />
          <h2>Saved Entities</h2>
          <div>
            {savedEntities.map((entity, index) => (
              <div
                className='saved-entity'
                key={entity.table_name}
                onClick={() => showSavedEntity(index)}
              >
                {entity.table_name}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default App;
