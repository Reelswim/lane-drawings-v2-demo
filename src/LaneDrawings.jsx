import React, { memo, useMemo } from 'react';
import { easeExpIn, easeExpOut } from 'd3-ease';

import { getTransform2d } from './quickMaths';

import '@fontsource/open-sans';

const getTeamLogoShadow = (darkShadow) => `drop-shadow(${darkShadow ? 'black' : 'white'} 0px 10px 15px)`;

// Note: time is in milliseconds
function formatTime(timeMs, showHours = true) {
  if (Number.isNaN(timeMs)) return undefined;
  const duration = moment.duration({
    milliseconds: timeMs,
  });

  const hundreds = Math.floor(duration.milliseconds() / 10);

  const p = val => val.toString().padStart(2, '0');

  const hoursStr = showHours ? `${p(Math.floor(duration.asHours()))}:` : '';
  return `${hoursStr}${p(duration.minutes())}:${p(duration.seconds())}.${p(hundreds)}`;
}


export const handleSize = 20;

const inTransitionDuration = 1;
const outTransitionDuration = 0.6;

const offsetToMakeRoomForSwimmer = 0.23;

const Lane = memo(({ corners, boxWidth, boxHeight, swimmerLastName, laneNumber, laneOrPlaceNumber, showInstruction, editing, enableInteraction, orientation, makeRoomForSwimmerInWater, isSwimEnd, swimStartTime, swimEndTime, time, teamLogoUrl, darkShadow = true, swimDuration, isMainSwimmer }) => {
  const perspectiveTransform = useMemo(() => getTransform2d(boxWidth, boxHeight, corners[0], corners[1], corners[2], corners[3], corners[4], corners[5], corners[6], corners[7]), [boxHeight, boxWidth, corners]);

  const isRtl = orientation === 'rtl';

  const { boxTransform, numberTransform, numberOpacity = 1 } = useMemo(() => {
    const transitionDirection = isRtl ? 1 : -1;

    if (isSwimEnd) {
      const numberTransformDelay = 1;
      const timeAfterSwimEnd = time != null ? time - swimEndTime : 2;
      const eased = easeExpOut(Math.min(1, Math.max(0, timeAfterSwimEnd)));
      const eased2 = easeExpOut(Math.min(1, Math.max(0, timeAfterSwimEnd - numberTransformDelay)));

      const inTransitionTransform = `translateX(${transitionDirection * (eased - 1) * boxWidth * 2}px)`;
      return {
        boxTransform: `${perspectiveTransform} ${inTransitionTransform}`,
        numberTransform: `translateX(${(eased2 - 1) * 100}px)`,
        numberOpacity: eased2,
      };
    }

    if (time != null) { // swim start
      const timeAfterVideoStart = time != null ? time : inTransitionDuration;
      const staggerAmount = isMainSwimmer === false ? 0.3 : 0;
      const easedIn = easeExpOut(Math.min(1, Math.max(0, timeAfterVideoStart - staggerAmount) / inTransitionDuration));
      const easedOut = easeExpIn(Math.max(0, timeAfterVideoStart + outTransitionDuration - swimStartTime) / outTransitionDuration);

      const inOutTransitionTransform = `translateX(${transitionDirection * (easedIn - 1 - easedOut) * boxWidth * 2}px)`;

      return {
        boxTransform: `${perspectiveTransform} ${inOutTransitionTransform}`,
      };
    }

    return {
      boxTransform: perspectiveTransform,
    };
  }, [boxWidth, isMainSwimmer, isRtl, isSwimEnd, perspectiveTransform, swimEndTime, swimStartTime, time]);

  const gradientColor = isMainSwimmer === false ? '213deg 40% 41%' : '213deg 100% 41%';
  const boxOpacity = isMainSwimmer === false ? 0.7 : undefined;
  const laneNumberColorStart = isMainSwimmer === false ? 'hsl(213deg 100% 21% / 30%)' : 'hsl(213deg 100% 21% / 60%)';

  const boxStyle = useMemo(() => ({
    pointerEvents: 'none',
    position: 'absolute',
    width: boxWidth,
    height: boxHeight,
    transformOrigin: '0 0',
    fontFamily: 'Open Sans',
    transform: boxTransform,
    opacity: boxOpacity,
  }), [boxHeight, boxOpacity, boxTransform, boxWidth]);

  // Make room for swimmer in the water at the end of the swim and for certain event types
  const overlayOffset = makeRoomForSwimmerInWater ? offsetToMakeRoomForSwimmer * boxWidth : 0;

  // Make it wider than the container (handle points) and overflow in case of long names
  const boxBackgroundStyle = useMemo(() => ({
    position: 'absolute', height: '100%', width: '130%', right: isRtl ? overlayOffset : undefined, left: orientation === 'ltr' ? overlayOffset : undefined, filter: 'blur(1em)', background: `linear-gradient(${orientation === 'rtl' ? 90 : 270}deg, hsl(${gradientColor} / 0%) 0%, hsl(${gradientColor} / 70%) 28%)`,
  }), [gradientColor, isRtl, orientation, overlayOffset]);

  // Stuff can overflow from this, it's ok (and desired)
  const boxForegroundStyle = useMemo(() => ({
    position: 'absolute', height: '100%', right: orientation === 'rtl' ? overlayOffset : undefined, left: orientation === 'ltr' ? overlayOffset : undefined, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flexDirection: orientation === 'rtl' ? 'row' : 'row-reverse',
  }), [orientation, overlayOffset]);

  const handleStyle = useMemo(() => ({
    pointerEvents: 'none',
    position: 'absolute',
    top: 0,
    left: 0,
    marginLeft: -handleSize / 2,
    marginTop: -handleSize / 2,
    width: handleSize,
    height: handleSize,
    background: 'white',
    opacity: editing ? undefined : 0.2,
    border: `${handleSize * 0.1}px solid black`,
    boxSizing: 'border-box',
    borderRadius: handleSize / 2,
    zIndex: editing ? 1 : undefined,
  }), [editing]);

  const isDoubleDigitLaneOrPlaceNumber = laneOrPlaceNumber >= 10;

  const laneNumberStyle = useMemo(() => ({
    backgroundColor: isSwimEnd ? 'hsla(0, 100%, 30%, 0.6)' : laneNumberColorStart, alignSelf: 'stretch', width: '.8em', fontWeight: 'bold', fontSize: 130, borderRadius: 6, flexShrink: 0, margin: '10px 0', transform: numberTransform, opacity: numberOpacity, display: 'flex', alignItems: 'center', justifyContent: 'center',
  }), [isSwimEnd, laneNumberColorStart, numberOpacity, numberTransform]);

  const laneNumberTextStyle = useMemo(() => ({
    fontSize: isDoubleDigitLaneOrPlaceNumber ? '70%' : undefined, letterSpacing: isDoubleDigitLaneOrPlaceNumber ? '-.05em' : undefined,
  }), [isDoubleDigitLaneOrPlaceNumber]);

  const marginSize = isSwimEnd ? 6 : 20;

  const logoStyle = useMemo(() => ({
    width: 100,
    marginLeft: orientation === 'ltr' ? marginSize : 0,
    marginRight: orientation === 'rtl' ? marginSize : 0,
    filter: getTeamLogoShadow(darkShadow),
  }), [darkShadow, marginSize, orientation]);

  const swimmerLastNameStyle = useMemo(() => ({
    whiteSpace: 'nowrap',
    textTransform: 'uppercase',
    fontSize: 70,
    letterSpacing: -5,
    marginRight: orientation === 'rtl' ? marginSize : 0,
    marginLeft: orientation === 'ltr' ? marginSize : 0,
  }), [marginSize, orientation]);

  // It takes up a lot of space
  const showFinalTime = false;

  const finalTimeStyle = useMemo(() => ({
    whiteSpace: 'nowrap',
    fontSize: 70,
    letterSpacing: -5,
    marginRight: orientation === 'rtl' ? marginSize : 0,
    marginLeft: orientation === 'ltr' ? marginSize : 0,
    background: 'hsl(213deg 100% 21% / 40%)',
    padding: '0px 3px',
    borderRadius: 10,
  }), [marginSize, orientation]);

  return (
    <>
      <div style={boxStyle}>
        <div style={boxBackgroundStyle} />

        <div style={boxForegroundStyle}>
          <div style={swimmerLastNameStyle}>
            {swimmerLastName}
          </div>

          {isSwimEnd && showFinalTime && (
            <div style={finalTimeStyle}>
              {formatTime(swimDuration * 1000, false)}
            </div>
          )}

          {teamLogoUrl != null && (
            <img src={teamLogoUrl} style={logoStyle} />
          )}

          {laneOrPlaceNumber != null && (
            <div style={laneNumberStyle}>
              <span style={laneNumberTextStyle}>{laneOrPlaceNumber}</span>
            </div>
          )}
        </div>
      </div>

      {enableInteraction && showInstruction && editing && (
        <div style={{ zIndex: 1, left: corners[0], top: corners[1] - boxHeight * 0.15, position: 'absolute', whiteSpace: 'nowrap', fontSize: boxHeight * 0.08, background: 'rgba(255,255,255,0.8)', padding: boxHeight * 0.02, borderRadius: boxHeight * 0.02, pointerEvents: 'none' }}>
          Align overlay with lane {laneNumber}
        </div>
      )}

      {enableInteraction && (
        <>
          <div style={{ ...handleStyle, left: corners[0], top: corners[1] }} />
          <div style={{ ...handleStyle, left: corners[2], top: corners[3] }} />
          <div style={{ ...handleStyle, left: corners[4], top: corners[5] }} />
          <div style={{ ...handleStyle, left: corners[6], top: corners[7] }} />
        </>
      )}
    </>
  );
});

const LaneWrapper = memo(({ canvasWidth, laneNumberStr, corners, editingLaneNumber, showInstruction = false, boxWidth, boxHeight, orientation, isSwimEnd, makeRoomForSwimmerInWater, enableInteraction, getResultsByLaneNumber, mainSwimmerLaneNumber, time }) => {
  const cornersPixels = useMemo(() => corners.map((v) => v * canvasWidth), [canvasWidth, corners]);
  const laneNumber = parseInt(laneNumberStr, 10);
  const isMainSwimmer = mainSwimmerLaneNumber != null ? mainSwimmerLaneNumber === laneNumber : undefined;

  const results = useMemo(() => getResultsByLaneNumber(laneNumber), [getResultsByLaneNumber, laneNumber]);

  if (isSwimEnd && isMainSwimmer === false) return null;
  if (!results) return null;

  const { swimmerLastName, placeRanking, swimEndTime, swimDuration, teamLogoUrl, darkShadow } = results;
  const laneOrPlaceNumber = isSwimEnd ? placeRanking : laneNumber;
  const swimStartTime = results.swimStartTime || inTransitionDuration + outTransitionDuration;

  return (
    <Lane boxWidth={boxWidth} boxHeight={boxHeight} corners={cornersPixels} laneNumber={laneNumber} laneOrPlaceNumber={laneOrPlaceNumber} swimmerLastName={swimmerLastName} showInstruction={showInstruction} editing={editingLaneNumber === laneNumber} enableInteraction={enableInteraction} orientation={orientation} isSwimEnd={isSwimEnd} makeRoomForSwimmerInWater={makeRoomForSwimmerInWater} time={time} swimStartTime={swimStartTime} swimEndTime={swimEndTime} teamLogoUrl={teamLogoUrl} darkShadow={darkShadow} swimDuration={swimDuration} isMainSwimmer={isMainSwimmer} />
  );
});

const LaneDrawings = memo(({ mouseMove, mouseUp, mouseDown, canvasWidth, canvasHeight, editingLaneNumber, showInstruction, boxWidth, boxHeight, drawingByLaneNumber, orientation, isSwimEnd, makeRoomForSwimmerInWater, enableInteraction, getResultsByLaneNumber, mainSwimmerLaneNumber, time }) => {
  const containerStyle = useMemo(() => ({
    userSelect: 'none', position: 'relative', width: canvasWidth, height: canvasHeight, overflow: 'hidden',
  }), [canvasHeight, canvasWidth]);

  if (drawingByLaneNumber == null) return null;

  return (
    <>
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
      <div onMouseMove={mouseMove} onMouseUp={mouseUp} onMouseDown={mouseDown} onMouseOut={mouseUp} onBlur={mouseUp} style={containerStyle}>
        {Object.entries(drawingByLaneNumber).map(([laneNumberStr, { corners, enabled }]) => {
          if (!enabled) return null;
          return <LaneWrapper key={laneNumberStr} canvasWidth={canvasWidth} laneNumberStr={laneNumberStr} corners={corners} editingLaneNumber={editingLaneNumber} showInstruction={showInstruction} boxWidth={boxWidth} boxHeight={boxHeight} orientation={orientation} isSwimEnd={isSwimEnd} makeRoomForSwimmerInWater={makeRoomForSwimmerInWater} enableInteraction={enableInteraction} getResultsByLaneNumber={getResultsByLaneNumber} mainSwimmerLaneNumber={mainSwimmerLaneNumber} time={time} />;
        })}
      </div>
    </>
  );
});

export default LaneDrawings;
