import {ScanError} from './provider.ts';
/** Reserve synchronously immediately before inference; normalization may have awaited. */
export function reserveInferenceBudget(state:{hour:number;hourCount:number},now=Date.now()){
 if(now-state.hour>=3_600_000){state.hour=now;state.hourCount=0}
 if(state.hourCount>=50)throw new ScanError(429,'The hourly demo limit has been reached. Please return later.');
 state.hourCount++;
}
