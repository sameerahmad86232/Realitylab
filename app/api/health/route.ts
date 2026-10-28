import {configuration} from '../../../lib/server/provider';
import {scanState} from '../../../lib/server/scan';
export const runtime='nodejs';
export function GET(){const {configured,provider,model}=configuration();return Response.json({status:'ok',app:'RealityLab',release:'visual-atlas-v10',analysis:{configured,provider,model,liveVerified:scanState.lastSuccess!==null,lastSuccess:scanState.lastSuccess}},{headers:{'Cache-Control':'no-store'}})}
