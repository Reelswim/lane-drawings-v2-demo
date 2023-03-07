import React, { memo, useRef, useState, useMemo, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import { CircleIcon, IconButton, Button, ResetIcon, CrossIcon, TickCircleIcon, DirectionRightIcon, DirectionLeftIcon, DoubleChevronLeftIcon, DoubleChevronRightIcon } from 'evergreen-ui';
import uniqBy from 'lodash/uniqBy';

import LaneDrawings, { handleSize } from './LaneDrawings';


// These values don't matter so much, but higher values will yield better quality (but probably lower performance)
const boxWidth = 600;
const boxHeight = 200;

// Just some dummy data:

function getResultsByLaneNumber(laneNumber) {
  return Object.fromEntries(Array.from({ length: 9 }).map((a, i) => ([
    i,
    {
      swimmerLastName: `Lane ${i} Swimmer`,
      placeRanking: i + 1,
      swimEndTime: 10 + Math.random() * 5,
      swimDuration: 5 + Math.random() * 5,
      teamLogoUrl: 'https://swimclips-teams.s3.amazonaws.com/logos/MITT.svg',
      darkShadow: true,
      swimStartTime: 2,
    },
  ])))[laneNumber];
}

const canvasWidth = 1280;
const canvasHeight = 720;

// Here is some dummy data:
const src = 'https://swimclips-static.s3.us-east-1.amazonaws.com/lane-drawings-v2-demo-sample.mp4';

const firstLaneNumber = 0;
const activeLaneNumbers = [0, 1, 2, 3, 4, 5, 6, 7, 8];

const dummyDrawingsByLaneNumber = {
  "0": {
    "enabled": false,
    "corners": [0.2, 0.2, 0.8, 0.2, 0.2, 0.4, 0.8, 0.4],
  },
  "1": {
    "enabled": true,
    "corners": [
      0.3411111111111111,
      0,
      0.62,
      0,
      0.3244444444444444,
      0.023333333333333334,
      0.62,
      0.014444444444444444
    ]
  },
  "2": {
    "enabled": true,
    "corners": [
      0.3244444444444444,
      0.023333333333333334,
      0.62,
      0.014444444444444444,
      0.30444444444444446,
      0.04111111111111111,
      0.6266666666666667,
      0.03222222222222222
    ]
  },
  "3": {
    "enabled": true,
    "corners": [
      0.30444444444444446,
      0.04111111111111111,
      0.6266666666666667,
      0.03222222222222222,
      0.2777777777777778,
      0.07555555555555556,
      0.6411111111111111,
      0.06111111111111111
    ]
  },
  "4": {
    "enabled": true,
    "corners": [
      0.2777777777777778,
      0.07555555555555556,
      0.6411111111111111,
      0.06111111111111111,
      0.24222222222222223,
      0.11,
      0.6577777777777778,
      0.09555555555555556
    ]
  },
  "5": {
    "enabled": true,
    "corners": [
      0.24222222222222223,
      0.11,
      0.6577777777777778,
      0.09555555555555556,
      0.2088888888888889,
      0.16,
      0.6811111111111111,
      0.14222222222222222
    ]
  },
  "6": {
    "enabled": true,
    "corners": [
      0.2088888888888889,
      0.16,
      0.6811111111111111,
      0.14222222222222222,
      0.14888888888888888,
      0.22444444444444445,
      0.7133333333333334,
      0.22
    ]
  },
  "7": {
    "enabled": true,
    "corners": [
      0.14888888888888888,
      0.22444444444444445,
      0.7133333333333334,
      0.22,
      0.09666666666666666,
      0.3088888888888889,
      0.7455555555555555,
      0.31555555555555553
    ]
  },
  "8": {
    "enabled": true,
    "corners": [
      0.09666666666666666,
      0.3088888888888889,
      0.7455555555555555,
      0.31555555555555553,
      0.035555555555555556,
      0.41555555555555557,
      0.7866666666666666,
      0.46444444444444444
    ]
  }
}

function getInitialCorners() {
  // Store all values relative to canvasWidth (also video width)
  const topX = 0.2;
  const topY = 0.2;
  const initialBoxAspectRatio = boxWidth / boxHeight;
  const initialBoxWidth = 0.6;
  const initialBoxHeight = initialBoxWidth / initialBoxAspectRatio;
  const bottomX = topX + initialBoxWidth;
  const bottomY = topY + initialBoxHeight;

  return [topX, topY, bottomX, topY, topX, bottomY, bottomX, bottomY];
}

const LaneDrawer = memo(() => {
  const [editingLaneNumber, setEditingLaneNumber] = useState(firstLaneNumber);
  const [showInstruction, setShowInstruction] = useState(true);
  const [swimEndPreview, setSwimEndPreview] = useState(false);

  const [orientation, setOrientation] = useState('ltr');
  const [drawingByLaneNumber, setDrawingByLaneNumber] = useState(dummyDrawingsByLaneNumber);
  const [time, setTime] = useState(1);

  const reset = useCallback(() => {
    setDrawingByLaneNumber({});
    setEditingLaneNumber(firstLaneNumber);
    setShowInstruction(true);
  }, [firstLaneNumber, setDrawingByLaneNumber]);

  const onResetClick = useCallback(async () => {
    reset();
  }, [reset]);

  function selectLane(laneNumber) {
    setShowInstruction(true);
    setEditingLaneNumber(laneNumber);
  }

  const editedCornersEntries = Object.entries(drawingByLaneNumber);

  const editingLaneDrawing = useMemo(() => {
    const ret = drawingByLaneNumber[editingLaneNumber];
    if (ret) return ret;

    if (editedCornersEntries.length === 0) {
      return {
        corners: getInitialCorners(),
        enabled: true,
      };
    }

    const lastEditedLane = editedCornersEntries[editedCornersEntries.length - 1];
    const { corners: c } = lastEditedLane[1];
    return {
      corners: [c[4], c[5], c[6], c[7], c[0], c[1], c[2], c[3]], // flip the coordinates so that it's upside down
      enabled: true,
    };
  }, [drawingByLaneNumber, editedCornersEntries, editingLaneNumber]);

  // Only show the overlays that have been edited (and the currently editing one)
  const visibleDrawingByLaneNumber = Object.fromEntries(uniqBy([
    ...editedCornersEntries,
    ...(editingLaneDrawing.corners != null ? [[editingLaneNumber, editingLaneDrawing]] : []),
  ], ([laneNumberStr]) => laneNumberStr));

  const setCurrentLaneCorners = useCallback((newCorners) => setDrawingByLaneNumber({ ...drawingByLaneNumber, [editingLaneNumber]: newCorners }), [drawingByLaneNumber, editingLaneNumber, setDrawingByLaneNumber]);

  const toggleLaneEnabled = (laneNumber) => {
    const { corners = getInitialCorners(), enabled = true, ...rest } = drawingByLaneNumber[laneNumber] || {};
    setDrawingByLaneNumber({
      ...drawingByLaneNumber,
      [laneNumber]: {
        ...rest,
        corners,
        enabled: !enabled,
      },
    });
  };

  const draggingCornerRef = useRef(-1);

  const mouseMove = useCallback((e) => {
    if (draggingCornerRef.current < 0) return;
    if (!editingLaneDrawing) return;

    const x = e.nativeEvent.offsetX / canvasWidth;
    const y = e.nativeEvent.offsetY / canvasWidth;
    const cornersNew = [...editingLaneDrawing.corners];
    cornersNew[draggingCornerRef.current] = x;
    cornersNew[draggingCornerRef.current + 1] = y;
    setCurrentLaneCorners({ enabled: editingLaneDrawing.enabled, corners: cornersNew });
  }, [canvasWidth, editingLaneDrawing, setCurrentLaneCorners]);

  const mouseDown = useCallback((e) => {
    if (!editingLaneDrawing) return;

    setShowInstruction(false);
    const x = e.nativeEvent.offsetX;
    const y = e.nativeEvent.offsetY;
    let dx;
    let dy;
    let best = handleSize ** 2;
    draggingCornerRef.current = -1;
    for (let i = 0; i < 8; i += 2) {
      dx = x - editingLaneDrawing.corners[i] * canvasWidth;
      dy = y - editingLaneDrawing.corners[i + 1] * canvasWidth;
      if (best > dx * dx + dy * dy) {
        best = dx * dx + dy * dy;
        draggingCornerRef.current = i;
      }
    }
    mouseMove(e);
  }, [canvasWidth, editingLaneDrawing, mouseMove]);

  const mouseUp = useCallback(() => {
    draggingCornerRef.current = -1;
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginLeft: 10, marginTop: 5, marginBottom: 10 }}>
        <div style={{ marginBottom: 10 }}>Please draw all lanes as they appear in the meet results. Deactivate <CrossIcon style={{ verticalAlign: 'middle' }} /> / <TickCircleIcon style={{ verticalAlign: 'middle' }} /> lanes that are not covered by this camera. Make sure that Orientation <DirectionLeftIcon style={{ verticalAlign: 'middle' }} /> <DirectionRightIcon style={{ verticalAlign: 'middle' }} /> is correct. Make sure to preview both <b>Start</b> and <b>Finish</b> to make sure everything looks good. Make sure there is room for names. View the example before drawing. Be sure to <b>check that the camera did not move</b> during the meet day.</div>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
          {activeLaneNumbers.map((laneNumber) => {
            const { enabled = true, corners } = drawingByLaneNumber[laneNumber] || {};

            function getLaneButtonColor() {
              if (editingLaneNumber !== laneNumber) return undefined;
              return enabled ? 'success' : 'danger';
            }
            function getIcon() {
              if (!enabled) return CrossIcon;
              if (!corners) return CircleIcon;
              return TickCircleIcon;
            }
            return (
              <div key={laneNumber} style={{ display: 'flex', marginRight: 7 }} title={enabled ? `Draw lane ${laneNumber}` : `Lane overlays are deactivated for lane ${laneNumber}`}>
                <Button appearance={editingLaneNumber === laneNumber ? 'primary' : undefined} intent={getLaneButtonColor()} onClick={() => selectLane(laneNumber)}>Lane {laneNumber}</Button>
                <IconButton icon={getIcon()} intent={enabled ? 'success' : 'danger'} onClick={() => toggleLaneEnabled(laneNumber)} />
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
          <Button iconBefore={orientation === 'rtl' ? DirectionLeftIcon : DirectionRightIcon} onClick={() => setOrientation(orientation === 'ltr' ? 'rtl' : 'ltr')}>Orientation</Button>

          <Button iconBefore={ResetIcon} onClick={onResetClick} intent="danger">Start over</Button>

          <Button iconBefore={swimEndPreview ? DoubleChevronRightIcon : DoubleChevronLeftIcon} appearance="primary" onClick={() => setSwimEndPreview(v => !v)}>{swimEndPreview ? 'Previewing finish' : 'Previewing start'}</Button>

          <input type="range" min="0" max="1000" value={Math.floor((time / 20) * 1000)} onChange={(e) => setTime((parseInt(e.target.value, 10) / 1000) * 20)} style={{ width: 600 }} />
        </div>
      </div>

      <div style={{ overflow: 'auto', flexGrow: 1, backgroundColor: 'black' }}>
        <div style={{ width: canvasWidth, height: canvasHeight, position: 'relative', margin: 'auto' }}>
          <video src={src} autoPlay loop muted style={{ display: 'block', position: 'absolute', pointerEvents: 'none', width: canvasWidth, height: canvasHeight }} />

          <div style={{ position: 'absolute' }}>
            <LaneDrawings
              time={time}
              mouseMove={mouseMove}
              mouseUp={mouseUp}
              mouseDown={mouseDown}
              canvasWidth={canvasWidth}
              canvasHeight={canvasHeight}
              editingLaneNumber={editingLaneNumber}
              showInstruction={showInstruction}
              boxWidth={boxWidth}
              boxHeight={boxHeight}
              drawingByLaneNumber={visibleDrawingByLaneNumber}
              orientation={orientation}
              isSwimEnd={swimEndPreview}
              getResultsByLaneNumber={getResultsByLaneNumber}
              makeRoomForSwimmerInWater={swimEndPreview}
              enableInteraction
            />
          </div>
        </div>
      </div>
    </div>
  );
});


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <LaneDrawer />
  </React.StrictMode>,
);
