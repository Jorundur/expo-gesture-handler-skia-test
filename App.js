import { StyleSheet, Text, View } from "react-native";
import "expo-dev-client";

import {
  Skia,
  Group,
  useComputedValue,
  useValue,
  Line,
  Canvas,
  Circle,
  Fill,
  LinearGradient,
  Path,
  vec,
  useSharedValueEffect,
} from "@shopify/react-native-skia";
import React, { useMemo, useRef } from "react";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
  ScrollView,
} from "react-native-gesture-handler";
import { useSharedValue } from "react-native-reanimated";

export default function App() {
  const panRef = useRef(null);

  return (
    <GestureHandlerRootView style={styles.container}>
      <ScrollView simultaneousGestures={[panRef]}>
        <Slider height={400} width={400} panRef={panRef} />
        <View style={styles.box} />
        <View style={styles.box} />
        <View style={styles.box} />
      </ScrollView>
    </GestureHandlerRootView>
  );
}

const Slider = ({ height, width, panRef }) => {
  const path = useMemo(
    () => createGraphPath(width, height, 60, false),
    [height, width]
  );

  const touchPos = useValue(
    getPointAtPositionInPath(width / 2, width, 60, path)
  );

  const lineP1 = useComputedValue(
    () => vec(touchPos.current.x, touchPos.current.y + 14),
    [touchPos]
  );
  const lineP2 = useComputedValue(
    () => vec(touchPos.current.x, height),
    [touchPos]
  );

  const xPosShared = useSharedValue(width / 2);

  useSharedValueEffect(() => {
    touchPos.current = getPointAtPositionInPath(
      xPosShared.value,
      width,
      60,
      path
    );
  }, xPosShared);

  const dragGesture = Gesture.Pan()
    .onTouchesMove((e) => {
      xPosShared.value = e.changedTouches[0].x;
    })
    .onStart(() => {
      console.log("onStart!");
    })
    .onUpdate(() => {
      console.log("onUpdate!");
    })
    .onEnd(() => {
      console.log("onEnd!");
    })
    .withRef(panRef);

  return (
    <View style={{ height, marginBottom: 10 }}>
      <GestureDetector gesture={dragGesture}>
        <Canvas style={styles.graph}>
          <Fill color="black" />
          <Path
            path={path}
            strokeWidth={4}
            style="stroke"
            strokeJoin="round"
            strokeCap="round"
          >
            <LinearGradient
              start={vec(0, height * 0.5)}
              end={vec(width * 0.5, height * 0.5)}
              colors={["black", "#DA4167"]}
            />
          </Path>
          <Group color="#fff">
            <Circle c={touchPos} r={10} />
            <Circle color="#DA4167" c={touchPos} r={7.5} />
            <Line p1={lineP1} p2={lineP2} />
          </Group>
        </Canvas>
      </GestureDetector>
      <Text>Touch and drag to move center point</Text>
    </View>
  );
};

const getPointAtPositionInPath = (x, width, steps, path) => {
  const index = Math.max(0, Math.floor(x / (width / steps)));
  const fraction = (x / (width / steps)) % 1;
  const p1 = path.getPoint(index);
  if (index < path.countPoints() - 1) {
    const p2 = path.getPoint(index + 1);
    // Interpolate between p1 and p2
    return {
      x: p1.x + (p2.x - p1.x) * fraction,
      y: p1.y + (p2.y - p1.y) * fraction,
    };
  }
  return p1;
};

const createGraphPath = (width, height, steps, round = true) => {
  const retVal = Skia.Path.Make();
  let y = height / 2;
  retVal.moveTo(0, y);
  const prevPt = { x: 0, y };
  for (let i = 0; i < width; i += width / steps) {
    // increase y by a random amount between -10 and 10
    y += Math.random() * 30 - 15;
    y = Math.max(height * 0.2, Math.min(y, height * 0.7));

    if (round && i > 0) {
      const xMid = (prevPt.x + i) / 2;
      const yMid = (prevPt.y + y) / 2;
      retVal.quadTo(prevPt.x, prevPt.y, xMid, yMid);
      prevPt.x = i;
      prevPt.y = y;
    } else {
      retVal.lineTo(i, y);
    }
  }
  return retVal;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 50,
  },
  box: {
    height: 400,
    width: 400,
    backgroundColor: "blue",
    margin: 4,
  },
  graph: {
    flex: 1,
  },
});
