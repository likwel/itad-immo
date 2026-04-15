'use strict';

class Recording {
    constructor(
        stream,
        recordingLabel,
        recordingTime,
        recordingStop,
        recordingStart,
        videoSelect = null,
        audioSelect = null
    ) {
        this._stream = stream;
        this._recordingLabel = recordingLabel;
        this._recordingStop = recordingStop;
        this._recordingStart = recordingStart;
        this._videoSelect = videoSelect;
        this._audioSelect = audioSelect;
        this._recordingTime = recordingTime;
        this._mediaRecorder = null;
        this._recordedBlobs = [];
        this._recordingStream = false;
        this._recStartTs = null;
    }

    start() {
        let options = this.getSupportedMimeTypes();
        console.log('MediaRecorder options supported', options);
        options = { mimeType: options[0] };
        try {
            this._mediaRecorder = new MediaRecorder(this._stream, options);
            this._mediaRecorder.start();
            this._mediaRecorder.addEventListener('start', (e) => {
                playSound('recStart');
                console.log('MediaRecorder started', e);
                this._recordingStream = true;
                this._recStartTs = performance.now();
                this.handleElements();
                startRecordingTimer();
            });
            this._mediaRecorder.addEventListener('dataavailable', (e) => {
                console.log('MediaRecorder data', e);
                if (e.data && e.data.size > 0) this._recordedBlobs.push(e.data);
            });
            this._mediaRecorder.addEventListener('stop', (e) => {
                this._recordingStream = false;
                console.log('MediaRecorder stopped', e);
                this.handleElements();
                stopRecordingTimer();
                this.downloadRecordedStream();
            });
        } catch (err) {
            this._recordingStream = false;
            console.error('MediaRecorder error', err);
            return popupMessage('error', 'MediaRecorder', "Impossible de démarrer l'enregistrement du flux" + err);
        }
    }

    handleElements() {
        if (this._audioSelect) elementDisable(this._audioSelect, this._recordingStream);
        if (this._videoSelect) elementDisable(this._videoSelect, this._recordingStream);
        elementDisplay(this._recordingLabel, this._recordingStream);
        elementDisplay(this._recordingStop, this._recordingStream);
        elementDisplay(this._recordingStart, !this._recordingStream);
    }

    isStreamRecording() {
        return this._recordingStream;
    }

    getSupportedMimeTypes() {
        const possibleTypes = [
            'video/webm;codecs=vp9,opus',
            'video/webm;codecs=vp8,opus',
            'video/webm;codecs=h264,opus',
            'video/mp4;codecs=h264,aac',
            'video/mp4',
        ];
        return possibleTypes.filter((mimeType) => {
            return MediaRecorder.isTypeSupported(mimeType);
        });
    }

    getWebmFixerFn() {
        const fn = window.FixWebmDuration;
        return typeof fn === 'function' ? fn : null;
    }

    downloadRecordedStream() {
        try {
            const type = this._recordedBlobs[0].type.includes('mp4') ? 'mp4' : 'webm';
            const rawBlob = new Blob(this._recordedBlobs, { type: 'video/' + type });
            const recFileName = getDataTimeString() + '-recording.' + type;
            const currentDevice = isMobileDevice ? 'MOBILE' : 'PC';
            const blobFileSize = this.bytesToSize(rawBlob.size);
            popupMessage(
                'clean',
                'Enregistrement',
                `<div style="text-align: left;">
					🔴 &nbsp; Informations sur l'enregistrement:
					<ul>
                        <li>Temps: ${this._recordingTime.innerText}</li>
						<li>Fichier: ${recFileName}</li>
						<li>Size: ${blobFileSize}</li>
					</ul>
					"Veuillez patienter pendant le traitement, puis le fichier sera téléchargé sur votre appareil ${currentDevice}."
				</div>`
            );

            // Fix WebM duration to make it seekable
            const fixWebmDuration = async (blob) => {
                if (type !== 'webm') return blob;
                try {
                    const fix = this.getWebmFixerFn();
                    const durationMs = this._recStartTs ? performance.now() - this._recStartTs : undefined;
                    const fixed = await fix(blob, durationMs);
                    return fixed || blob;
                } catch (e) {
                    console.warn('WEBM duration fix failed, saving original blob:', e);
                    return blob;
                } finally {
                    this._recStartTs = null;
                }
            };

            (async () => {
                const finalBlob = await fixWebmDuration(rawBlob);
                this.saveBlobToFile(finalBlob, recFileName);
            })();
        } catch (err) {
            popupMessage('error', 'Enregistrement', 'Échec de la sauvegarde de l’enregistrement: ' + err);
        }
    }

    bytesToSize(bytes) {
        if (bytes == 0) return '0 Byte';
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
        return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
    }

    saveBlobToFile(blob, fileName) {
        playSound('recStop');
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 100);
    }

    stop() {
        this._mediaRecorder.stop();
    }
}
