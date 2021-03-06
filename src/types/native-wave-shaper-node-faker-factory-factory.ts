import { TConnectedNativeAudioBufferSourceNodeFactory } from './connected-native-audio-buffer-source-node-factory';
import { TInvalidStateErrorFactory } from './invalid-state-error-factory';
import { TIsDCCurveFunction } from './is-dc-curve-function';
import { TMonitorConnectionsFunction } from './monitor-connections-function';
import { TNativeAudioNodeFactory } from './native-audio-node-factory';
import { TNativeGainNodeFactory } from './native-gain-node-factory';
import { TNativeWaveShaperNodeFakerFactory } from './native-wave-shaper-node-faker-factory';

export type TNativeWaveShaperNodeFakerFactoryFactory = (
    createConnectedNativeAudioBufferSourceNode: TConnectedNativeAudioBufferSourceNodeFactory,
    createInvalidStateError: TInvalidStateErrorFactory,
    createNativeAudioNode: TNativeAudioNodeFactory,
    createNativeGainNode: TNativeGainNodeFactory,
    isDCCurve: TIsDCCurveFunction,
    monitorConnections: TMonitorConnectionsFunction
) => TNativeWaveShaperNodeFakerFactory;
