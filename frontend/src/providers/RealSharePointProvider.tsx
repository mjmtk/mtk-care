import React, { createContext, useContext, useState, useEffect } from "react";
import { spfi, SPFI, SPFx } from "@pnp/sp";
import { Web, IWebInfo } from "@pnp/sp/webs";
import "@pnp/sp/webs";
import "@pnp/sp/folders";
import "@pnp/sp/files";

// SharePoint configuration interface
interface SharePointConfig {
  siteUrl: string;
  clientId?: string;
  clientSecret?: string;
  accessToken?: string; // For testing with manually copied token
  tenantId?: string;
}

// SharePoint context
interface SharePointContextType {
  sp: SPFI | null;
  isConnected: boolean;
  error: string | null;
  config: SharePointConfig | null;
  setConfig: (config: SharePointConfig) => void;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const SharePointContext = createContext<SharePointContextType>({
  sp: null,
  isConnected: false,
  error: null,
  config: null,
  setConfig: () => {},
  connect: async () => {},
  disconnect: () => {}
});

export const RealSharePointProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sp, setSp] = useState<SPFI | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<SharePointConfig | null>(null);

  // Load config from environment variables or localStorage
  useEffect(() => {
    const envConfig = {
      siteUrl: process.env.NEXT_PUBLIC_SHAREPOINT_SITE_URL || '',
      clientId: process.env.NEXT_PUBLIC_SHAREPOINT_CLIENT_ID || '',
      clientSecret: process.env.NEXT_PUBLIC_SHAREPOINT_CLIENT_SECRET || '',
      tenantId: process.env.NEXT_PUBLIC_SHAREPOINT_TENANT_ID || '',
    };

    // Check localStorage for stored config (for testing)
    const storedConfig = localStorage.getItem('sharepoint-config');
    if (storedConfig) {
      try {
        const parsedConfig = JSON.parse(storedConfig);
        setConfig(parsedConfig);
      } catch (e) {
        console.warn('Failed to parse stored SharePoint config');
      }
    } else if (envConfig.siteUrl) {
      setConfig(envConfig);
    }
  }, []);

  const connect = async () => {
    if (!config?.siteUrl) {
      setError('SharePoint site URL is required');
      return;
    }

    try {
      setError(null);
      console.log('Connecting to SharePoint:', config.siteUrl);

      let spInstance: SPFI;

      if (config.accessToken) {
        // Use manually provided access token (for testing)
        spInstance = spfi(config.siteUrl).using({
          headers: {
            'Authorization': `Bearer ${config.accessToken}`,
            'Accept': 'application/json;odata=verbose',
            'Content-Type': 'application/json;odata=verbose'
          }
        });
      } else {
        // For production, you'd implement proper OAuth flow here
        // This is a simplified version for testing
        throw new Error('OAuth flow not implemented. Use access token for testing.');
      }

      // Test the connection
      const web = await spInstance.web();
      console.log('Connected to SharePoint site:', web.Title);

      setSp(spInstance);
      setIsConnected(true);
      
    } catch (err: any) {
      console.error('SharePoint connection error:', err);
      setError(err?.message || 'Failed to connect to SharePoint');
      setSp(null);
      setIsConnected(false);
    }
  };

  const disconnect = () => {
    setSp(null);
    setIsConnected(false);
    setError(null);
  };

  const updateConfig = (newConfig: SharePointConfig) => {
    setConfig(newConfig);
    // Store in localStorage for testing
    localStorage.setItem('sharepoint-config', JSON.stringify(newConfig));
    disconnect(); // Disconnect when config changes
  };

  return (
    <SharePointContext.Provider value={{
      sp,
      isConnected,
      error,
      config,
      setConfig: updateConfig,
      connect,
      disconnect
    }}>
      {children}
    </SharePointContext.Provider>
  );
};

export function useRealSharePoint() {
  return useContext(SharePointContext);
}

// SharePoint Configuration Component for Testing
export const SharePointConfigPanel: React.FC = () => {
  const { config, setConfig, connect, disconnect, isConnected, error } = useRealSharePoint();
  const [localConfig, setLocalConfig] = useState<SharePointConfig>(
    config || {
      siteUrl: 'https://manaakitech.sharepoint.com/sites/client_docs',
      clientId: '',
      clientSecret: '',
      accessToken: '',
      tenantId: ''
    }
  );

  const handleConnect = async () => {
    setConfig(localConfig);
    await connect();
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50 space-y-4">
      <h3 className="font-semibold">SharePoint Configuration (Testing)</h3>
      
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Site URL</label>
          <input
            type="text"
            value={localConfig.siteUrl}
            onChange={(e) => setLocalConfig(prev => ({ ...prev, siteUrl: e.target.value }))}
            className="w-full p-2 border rounded"
            placeholder="https://manaakitech.sharepoint.com/sites/client_docs"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Access Token (for testing)</label>
          <textarea
            value={localConfig.accessToken || ''}
            onChange={(e) => setLocalConfig(prev => ({ ...prev, accessToken: e.target.value }))}
            className="w-full p-2 border rounded h-24"
            placeholder="Paste access token from browser developer tools..."
          />
          <p className="text-xs text-gray-600 mt-1">
            Get this from browser dev tools → Network → Find a SharePoint request → Copy Authorization header value
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleConnect}
          disabled={!localConfig.siteUrl}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          {isConnected ? 'Reconnect' : 'Connect'}
        </button>
        
        {isConnected && (
          <button
            onClick={disconnect}
            className="px-4 py-2 bg-gray-600 text-white rounded"
          >
            Disconnect
          </button>
        )}
      </div>

      {error && (
        <div className="p-2 bg-red-100 border border-red-400 text-red-700 rounded">
          Error: {error}
        </div>
      )}

      {isConnected && (
        <div className="p-2 bg-green-100 border border-green-400 text-green-700 rounded">
          ✅ Connected to SharePoint successfully!
        </div>
      )}

      <div className="text-xs text-gray-600">
        <strong>Instructions for testing:</strong>
        <ol className="list-decimal list-inside mt-1 space-y-1">
          <li>Open SharePoint in your browser and log in</li>
          <li>Open Developer Tools (F12) → Network tab</li>
          <li>Navigate to a SharePoint page/document library</li>
          <li>Find a request to SharePoint in the Network tab</li>
          <li>Copy the "Authorization" header value (starts with "Bearer ")</li>
          <li>Paste it in the Access Token field above and connect</li>
        </ol>
      </div>
    </div>
  );
};