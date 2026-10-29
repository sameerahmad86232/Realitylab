'use client';
import {WifiOff} from 'lucide-react';
import {useOnline} from '../lib/use-online';
export default function ConnectionNotice(){const online=useOnline();return online?null:<div className="connection-notice" role="status"><WifiOff size={17}/><p><strong>You’re offline.</strong> Keep this tab open to retain your draft. Local diagrams and downloads still work; reconnect before requesting new AI analysis.</p></div>}
