import { spy } from 'sinon';

describe('offlineAudioContextConstructor', () => {

    let offlineAudioContext;

    beforeEach(() => {
        offlineAudioContext = new OfflineAudioContext(1, 256000, 44100);
    });

    describe('destination', () => {

        // bug #52

        it('should allow to change the value of the channelCount property', () => {
            offlineAudioContext.destination.channelCount = 2;
        });

        // bug #53

        it('should allow to change the value of the channelCountMode property', () => {
            offlineAudioContext.destination.channelCountMode = 'max';
        });

    });

    describe('createBufferSource()', () => {

        describe('stop()', () => {

            // bug #44

            it('should throw a DOMException', () => {
                const audioBufferSourceNode = offlineAudioContext.createBufferSource();

                expect(() => audioBufferSourceNode.stop(-1)).to.throw(DOMException).with.property('name', 'InvalidStateError');
            });

        });

    });

    describe('createConstantSourceNode()', () => {

        // bug #164

        it('should not mute cycles', function () {
            this.timeout(10000);

            const constantSourceNode = offlineAudioContext.createConstantSource();
            const gainNode = offlineAudioContext.createGain();

            constantSourceNode
                .connect(gainNode)
                .connect(offlineAudioContext.destination);

            gainNode.connect(gainNode);

            constantSourceNode.start(0);

            return offlineAudioContext
                .startRendering()
                .then((renderedBuffer) => {
                    const channelData = new Float32Array(renderedBuffer.length);

                    renderedBuffer.copyFromChannel(channelData, 0);

                    for (const sample of channelData) {
                        expect(sample).to.not.equal(0);
                    }
                });
        });

    });

    describe('createScriptProcessor()', () => {

        describe('without any output channels', () => {

            // bug #87

            it('should not fire any AudioProcessingEvent', () => {
                const listener = spy();
                const oscillatorNode = offlineAudioContext.createOscillator();
                const scriptProcessorNode = offlineAudioContext.createScriptProcessor(256, 1, 0);

                scriptProcessorNode.onaudioprocess = listener;

                oscillatorNode.connect(scriptProcessorNode);
                oscillatorNode.start();

                return offlineAudioContext
                    .startRendering()
                    .then(() => {
                        expect(listener).to.have.not.been.called;
                    });
            });

        });

    });

});
