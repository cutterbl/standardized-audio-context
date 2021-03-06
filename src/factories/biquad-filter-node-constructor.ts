import { MOST_NEGATIVE_SINGLE_FLOAT, MOST_POSITIVE_SINGLE_FLOAT } from '../constants';
import { IAudioParam, IBiquadFilterNode, IBiquadFilterOptions } from '../interfaces';
import { TAudioNodeRenderer, TBiquadFilterNodeConstructorFactory, TBiquadFilterType, TContext, TNativeBiquadFilterNode } from '../types';

const DEFAULT_OPTIONS = {
    Q: 1,
    channelCount: 2,
    channelCountMode: 'max',
    channelInterpretation: 'speakers',
    detune: 0,
    frequency: 350,
    gain: 0,
    type: 'lowpass'
} as const;

export const createBiquadFilterNodeConstructor: TBiquadFilterNodeConstructorFactory = (
    audioNodeConstructor,
    createAudioParam,
    createBiquadFilterNodeRenderer,
    createInvalidAccessError,
    createNativeBiquadFilterNode,
    getNativeContext,
    isNativeOfflineAudioContext
) => {

    return class BiquadFilterNode<T extends TContext> extends audioNodeConstructor<T> implements IBiquadFilterNode<T> {

        private _detune: IAudioParam;

        private _frequency: IAudioParam;

        private _gain: IAudioParam;

        private _nativeBiquadFilterNode: TNativeBiquadFilterNode;

        private _Q: IAudioParam;

        constructor (context: T, options: Partial<IBiquadFilterOptions> = DEFAULT_OPTIONS) {
            const nativeContext = getNativeContext(context);
            const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
            const nativeBiquadFilterNode = createNativeBiquadFilterNode(nativeContext, mergedOptions);
            const isOffline = isNativeOfflineAudioContext(nativeContext);
            const biquadFilterNodeRenderer = <TAudioNodeRenderer<T, this>> ((isOffline) ? createBiquadFilterNodeRenderer() : null);

            super(context, false, nativeBiquadFilterNode, biquadFilterNodeRenderer);

            // Bug #80: Edge & Safari do not export the correct values for maxValue and minValue.
            this._Q = createAudioParam(
                this,
                isOffline,
                nativeBiquadFilterNode.Q,
                MOST_POSITIVE_SINGLE_FLOAT,
                MOST_NEGATIVE_SINGLE_FLOAT
            );
            // Bug #78: Firefox, Opera & Safari do not export the correct values for maxValue and minValue.
            this._detune = createAudioParam(
                this,
                isOffline,
                nativeBiquadFilterNode.detune,
                1200 * Math.log2(MOST_POSITIVE_SINGLE_FLOAT),
                -1200 * Math.log2(MOST_POSITIVE_SINGLE_FLOAT)
            );
            /*
             * Bug #77: Edge does not export the correct values for maxValue and minValue. Firefox & Safari do not export the correct value
             * for minValue.
             */
            this._frequency = createAudioParam(this, isOffline, nativeBiquadFilterNode.frequency, context.sampleRate / 2, 0);
            // Bug #79: Firefox, Opera & Safari do not export the correct values for maxValue and minValue.
            this._gain = createAudioParam(
                this,
                isOffline,
                nativeBiquadFilterNode.gain,
                40 * Math.log10(MOST_POSITIVE_SINGLE_FLOAT),
                MOST_NEGATIVE_SINGLE_FLOAT
            );
            this._nativeBiquadFilterNode = nativeBiquadFilterNode;
        }

        get detune (): IAudioParam {
            return this._detune;
        }

        get frequency (): IAudioParam {
            return this._frequency;
        }

        get gain (): IAudioParam {
            return this._gain;
        }

        get Q (): IAudioParam {
            return this._Q;
        }

        get type (): TBiquadFilterType {
            return this._nativeBiquadFilterNode.type;
        }

        set type (value) {
            this._nativeBiquadFilterNode.type = value;
        }

        public getFrequencyResponse (frequencyHz: Float32Array, magResponse: Float32Array, phaseResponse: Float32Array): void {
            this._nativeBiquadFilterNode.getFrequencyResponse(frequencyHz, magResponse, phaseResponse);

            // Bug #68: Only Chrome, Firefox & Opera do throw an error if the parameters differ in their length.
            if ((frequencyHz.length !== magResponse.length) || (magResponse.length !== phaseResponse.length)) {
                throw createInvalidAccessError();
            }
        }

    };

};
