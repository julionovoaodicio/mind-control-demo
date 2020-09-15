import React, { useState, useEffect } from "react";
import { observer, inject } from "mobx-react";
import { zipSamples } from "muse-js";
import { bandpassFilter, epoch, fft, sliceFFT } from "@neurosity/pipes";
import { Settings } from "../store";
import Card from "./Card";

import ml5 from "ml5";

let knnClassifier = ml5.KNNClassifier();

function PredictionPanel({ store: { museClient, isDroneConnected, moveLeft, moveRight } }) {
  const [psd, setPsd] = useState([]);
  const [samplesCount, setSamplesCount] = useState(0)
  const [classifyFlag, setClassifyFlag] = useState(false);

  const [prediction, setPrediction] = useState("");

  useEffect(() => {
    if (museClient) {
      const predictionPipe = zipSamples(museClient.eegReadings).pipe(
        bandpassFilter({
          cutoffFrequencies: [Settings.cutOffLow, Settings.cutOffHigh],
          nbChannels: 4
        }),
        epoch({
          duration: Settings.duration,
          interval: Settings.interval,
          samplingRate: Settings.srate
        }),
        fft({ bins: Settings.bins }),
        sliceFFT([Settings.sliceFFTLow, Settings.sliceFFTHigh])
      );
      predictionPipe.subscribe(eeg => {
        setPsd(eeg.psd);
      });
    }
  }, [museClient]);

  function addSample(label) {
    setSamplesCount(samplesCount + 1)
    knnClassifier.addExample(psd, label);
  }

  function onResult(err, result) {
    if (result.confidencesByLabel) {
      console.log(result.confidencesByLabel);
      if (result.label) {
        setPrediction(result.label);
      }
    }
  }

  useEffect(() => {
    if (classifyFlag && samplesCount > 0) {
      knnClassifier.classify(psd, onResult);
    }
  }, [psd, classifyFlag, samplesCount]);

  useEffect(() => {
    if (prediction === "Left") {
      moveLeft();
    }
    if (prediction === "Right") {
      moveRight();
    }
  }, [prediction, moveLeft, moveRight]);

  function classify() {
    setClassifyFlag(true);
  }

  return (
    <div>
      <div>{prediction && `Current Prediction: ${prediction}`}</div>
      <div className="flex flex-wrap items-center mt-32">
      { !isDroneConnected ? (
          <>
                  <Card
          isActive={prediction === 'Web/Mobile'}
          train={() => addSample("Web/Mobile")}
          image="https://assets.website-files.com/5b11ccbc11a9de5e0234a27d/5b4e4b3b7c4ce9850696679c_What-You-Need-to-Know-About-Mobile-Web-Design.jpg"
          text="Lorem ipsum, dolor sit amet consectetur adipisicing elit. Totam ea
            natus placeat nostrum veritatis amet ipsam! Saepe nisi adipisci
            illum quae expedita sunt, qui, deleniti esse aliquam est animi ab."
          title="Web/Mobile"
        />
        <Card
          isActive={prediction === 'VR/XR'}
          train={() => addSample("VR/XR")}
          image="https://www.criticalcase.com/file/2018/10/vr.png"
          text="Lorem ipsum, dolor sit amet consectetur adipisicing elit. Totam ea
            natus placeat nostrum veritatis amet ipsam! Saepe nisi adipisci
            illum quae expedita sunt, qui, deleniti esse aliquam est animi ab."
          title="VR/XR"
        />
        <Card
          isActive={prediction === 'IoT/AI'}
          train={() => addSample("IoT/AI")}
          image="data:image/jpeg;base64,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"
          text="Lorem ipsum, dolor sit amet consectetur adipisicing elit. Totam ea
            natus placeat nostrum veritatis amet ipsam! Saepe nisi adipisci
            illum quae expedita sunt, qui, deleniti esse aliquam est animi ab."
          title="IoT/AI"
        />
          </>
        ) : (
          <>
          <Card
          isActive={prediction === 'Left'}
          onActive={moveLeft}
          train={() => addSample("Left")}
          image="data:image/jpeg;base64,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SePk4rviPadXYi/u8pUznE/je1xsf2RYfMu+RU6jyvgETrspYf8Axt/4W0jiiiFomgD0FkFd5cyViOI1oqc3vdK/8rjwPygCwa09QAPbe6sVjWxsAYAABYAcADouyICIiAiIgIiICIiAiIgIiICIiAtfi+B4XjUWnFYWSAcFw3b7OG4+RWwRBD6ns5wSXDu5jMjGBxdGQ7xRE/FocbnSerTcey1dP2TYbHIDJPI63oL/AFN1YiIKP7UcAoMvVFLHRA6ZWzF2o3Liwx29razsFXmECeqxHuMPbrnlfojb5E9T5MA3J8gV9KZyyjhecMNEWKhw0u1Mew2cw2sbEgixHIII+gWJkvs/wHJ13YY1zpXCzpZCC8jnSLAAD2AvYXvZBu8BwyPBsFhp4TcRRtYCeXaRYk+pO/zWeiICIiAiIgIiICIiAuHAObZ24K5RBF8M7PsrYVjv2rD6drJRe1i7S0kWJay+kbEjYbdFKERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREH/2Q=="
          text="Turn drone left"
          title="Turn left"
        />
        <Card
          isActive={prediction === 'Right'}
          onActive={moveRight}
          train={() => addSample("Right")}
          image="data:image/jpeg;base64,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SePk4rviPadXYi/u8pUznE/je1xsf2RYfMu+RU6jyvgETrspYf8Axt/4W0jiiiFomgD0FkFd5cyViOI1oqc3vdK/8rjwPygCwa09QAPbe6sVjWxsAYAABYAcADouyICIiAiIgIiICIiAiIgIiICIiAtfi+B4XjUWnFYWSAcFw3b7OG4+RWwRBD6ns5wSXDu5jMjGBxdGQ7xRE/FocbnSerTcey1dP2TYbHIDJPI63oL/AFN1YiIKP7UcAoMvVFLHRA6ZWzF2o3Liwx29razsFXmECeqxHuMPbrnlfojb5E9T5MA3J8gV9KZyyjhecMNEWKhw0u1Mew2cw2sbEgixHIII+gWJkvs/wHJ13YY1zpXCzpZCC8jnSLAAD2AvYXvZBu8BwyPBsFhp4TcRRtYCeXaRYk+pO/zWeiICIiAiIgIiICIiAuHAObZ24K5RBF8M7PsrYVjv2rD6drJRe1i7S0kWJay+kbEjYbdFKERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREH/2Q=="
          text="Turn drone right"
          title="Turn Right"
        />
          </>
        )}
       </div>
      <div className={`${psd.length === 0 ? 'hidden': 'block'}`}>
        <div className={`${samplesCount > 0 ? 'bg-green-100': 'bg-red-300'} p-5 shadow-md m-5`}>
        <p>Samples recorded: <span>{samplesCount}</span></p>
        </div>
        <button className="bg-gray-100 p-5 shadow-lg" onClick={() => classify()}>Classify</button>
      </div>
    </div>
  );
}

export default inject("store")(observer(PredictionPanel));
