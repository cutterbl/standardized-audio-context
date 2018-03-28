import { createNativeGainNode } from '../helpers/create-native-gain-node';
import { INativeConstantSourceNode } from '../interfaces';
import { TNativeAudioNode, TNativeAudioParam, TUnpatchedAudioContext, TUnpatchedOfflineAudioContext } from '../types';

export class ConstantSourceNodeAccurateSchedulingWrapper {

    public wrap (
        constantSourceNode: INativeConstantSourceNode,
        audioContext: TUnpatchedAudioContext | TUnpatchedOfflineAudioContext
    ) {
        const gainNode = createNativeGainNode(audioContext);

        constantSourceNode.connect(gainNode);

        const disconnectGainNode = ((disconnect) => {
            return () => {
                disconnect.call(constantSourceNode, gainNode);
                constantSourceNode.removeEventListener('ended', disconnectGainNode);
            };
        })(constantSourceNode.disconnect);

        constantSourceNode.addEventListener('ended', disconnectGainNode);

        constantSourceNode.connect = ((destination: TNativeAudioNode | TNativeAudioParam, output = 0, input = 0) => {
            if (destination instanceof AudioNode) {
                // Bug #11: Safari does not support chaining yet, but that wrapper should not be used in Safari.
                return gainNode.connect.call(gainNode, destination, output, input);
            }

            // @todo This return statement is necessary to satisfy TypeScript.
            return gainNode.connect.call(gainNode, destination, output);
        });

        constantSourceNode.disconnect = function () {
            gainNode.disconnect.apply(gainNode, arguments);
        };

        let startTime = 0;
        let stopTime: null | number = null;

        const scheduleEnvelope = () => {
            gainNode.gain.cancelScheduledValues(0);
            gainNode.gain.setValueAtTime(0, 0);

            if (stopTime === null || startTime < stopTime) {
                gainNode.gain.setValueAtTime(1, startTime);
            }

            if (stopTime !== null && startTime < stopTime) {
                gainNode.gain.setValueAtTime(0, stopTime);
            }
        };

        constantSourceNode.start = ((start) => {
            return (when = 0) => {
                start.call(constantSourceNode, when);
                startTime = when;

                scheduleEnvelope();
            };
        })(constantSourceNode.start);

        constantSourceNode.stop = ((stop) => {
            return (when = 0) => {
                stop.call(constantSourceNode, when);
                stopTime = when;

                scheduleEnvelope();
            };
        })(constantSourceNode.stop);
    }

}

export const CONSTANT_SOURCE_NODE_ACCURATE_SCHEDULING_WRAPPER_PROVIDER = {
    deps: [ ],
    provide: ConstantSourceNodeAccurateSchedulingWrapper
};