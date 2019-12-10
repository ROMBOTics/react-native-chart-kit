import React, { Component } from "react";
import { View, Text as RNText, StyleSheet } from "react-native";
import { LinearGradient, Line, Text, Defs, Stop } from "react-native-svg";

class AbstractChart extends Component {
  calcScaler = (data, maxValue) => {
    if (this.props.fromZero) {
      return Math.max(...data, maxValue, 0) - Math.min(...data, 0) || 1;
    } else {
      return Math.max(...data, maxValue) - Math.min(...data) || 1;
    }
  };

  calcBaseHeight = (data, height) => {
    const min = Math.min(...data);
    const max = Math.max(...data);
    if (min >= 0 && max >= 0) {
      return height;
    } else if (min < 0 && max <= 0) {
      return 0;
    } else if (min < 0 && max > 0) {
      return (height * max) / this.calcScaler(data);
    }
  };

  calcHeight = (val, data, height, maxValue = 0) => {
    const max = Math.max(...data, maxValue);
    const min = Math.min(...data);
    if (min < 0 && max > 0) {
      return height * (val / this.calcScaler(data, maxValue));
    } else if (min >= 0 && max >= 0) {
      return this.props.fromZero
        ? height * (val / this.calcScaler(data, maxValue))
        : height * ((val - min) / this.calcScaler(data, maxValue));
    } else if (min < 0 && max <= 0) {
      return this.props.fromZero
        ? height * (val / this.calcScaler(dat, maxValue))
        : height * ((val - max) / this.calcScaler(data, maxValue));
    }
  };

  getPropsForBackgroundLines() {
    const { propsForBackgroundLines = {} } = this.props.chartConfig;
    return {
      stroke: this.props.chartConfig.color(0.2),
      strokeDasharray: "5, 10",
      strokeWidth: 1,
      ...propsForBackgroundLines
    };
  }

  getPropsForLabels() {
    const {
      propsForLabels = {},
      color,
      labelColor = color
    } = this.props.chartConfig;
    return {
      fontSize: 12,
      fill: labelColor(0.8),
      ...propsForLabels
    };
  }

  renderHorizontalLines = config => {
    const { count, width, height, paddingTop, paddingRight, paddingLeft = 0 } = config;
    return [...new Array(count)].map((_, i) => {
      return (
        <Line
          key={Math.random()}
          x1={paddingRight}
          y1={(height / count) * i + paddingTop}
          x2={width - paddingLeft}
          y2={(height / count) * i + paddingTop}
          {...this.getPropsForBackgroundLines()}
        />
      );
    });
  };

  renderHorizontalLine = config => {
    const { width, height, paddingTop, paddingRight, paddingLeft = 0 } = config;
    return (
      <Line
        key={Math.random()}
        x1={paddingRight}
        y1={height - height / 4 + paddingTop}
        x2={width - paddingLeft}
        y2={height - height / 4 + paddingTop}
        {...this.getPropsForBackgroundLines()}
      />
    );
  };

  renderHorizontalLabels = config => {
    const {
      count,
      dataset,
      height,
      width,
      paddingTop,
      paddingRight,
      paddingLeft,
      horizontalLabelRotation = 0,
      formatYLabel = yLabel => yLabel,
      side,
    } = config;
    const {
      yAxisLabel = "",
      yAxisSuffix: yAxisSuffixFromProps,
      yLabelsOffset = 12,
      chartConfig
    } = this.props;
    const { decimalPlaces = 2 } = chartConfig;
    const {data, maxValue = 0, yAxisSuffix = yAxisSuffixFromProps || ""} = dataset;
    return [...new Array(count)].map((_, i) => {
      let yLabel;

      if (count === 1) {
        yLabel = `${yAxisLabel}${formatYLabel(
          data[0].toFixed(decimalPlaces)
        )}${yAxisSuffix}`;
      } else {
        const label = this.props.fromZero
          ? (this.calcScaler(data, maxValue) / (count - 1)) * i + Math.min(...data, 0)
          : (this.calcScaler(data, maxValue) / (count - 1)) * i + Math.min(...data);
        yLabel = `${yAxisLabel}${formatYLabel(
          label.toFixed(decimalPlaces)
        )}${yAxisSuffix}`;
      }

     
      const x = side === "right" ? (width - paddingLeft + yLabelsOffset) : (paddingRight - yLabelsOffset);
      const y =
        count === 1 && this.props.fromZero
          ? paddingTop + 4
          : (height * 3) / 4 - ((height - paddingTop) / count) * i + 12;
      return (
        <Text
          rotation={horizontalLabelRotation}
          origin={`${x}, ${y}`}
          key={Math.random()}
          x={x}
          textAnchor={side === "right" ? "start" : "end"}
          y={y}
          {...this.getPropsForLabels()}
        >
          {yLabel}
        </Text>
      );
    });
  };

  renderVerticalLabels = config => {
    const {
      labels = [],
      width,
      height,
      paddingRight,
      paddingLeft = 0,
      paddingTop,
      horizontalOffset = 0,
      stackedBar = false,
      verticalLabelRotation = 0,
      position = 'start',
      formatXLabel = xLabel => xLabel
    } = config;
    const {
      xAxisLabel = "",
      xLabelsOffset = 0,
      hidePointsAtIndex = []
    } = this.props;
    const fontSize = 12;
    let fac = 1;
    if (stackedBar) {
      fac = 0.71;
    }
    return labels.map((label, i) => {
      if (hidePointsAtIndex.includes(i)) {
        return null;
      }
      const x =
        (((width - paddingRight - paddingLeft) / labels.length) * (i + (position === 'center' ? 0.5 : 0)) +
          paddingRight +
          horizontalOffset) *
        fac;
      const y = (height * 3) / 4 + paddingTop + fontSize * 2 + xLabelsOffset;
      return (
        <Text
          origin={`${x}, ${y}`}
          rotation={verticalLabelRotation}
          key={Math.random()}
          x={x}
          y={y}
          textAnchor={verticalLabelRotation === 0 ? "middle" : "start"}
          {...this.getPropsForLabels()}
        >
          {`${formatXLabel(label)}${xAxisLabel}`}
        </Text>
      );
    });
  };

  renderVerticalLines = config => {
    const { data, width, height, paddingTop, paddingRight, paddingLeft = 0 } = config;
    return [...new Array(data.length + 1)].map((_, i) => {
      let x = Math.floor( ((width - paddingRight - paddingLeft) / data.length) * i + paddingRight)
      return (
        <Line
          key={Math.random()}
          x1={x}
          y1={0}
          x2={x}
          y2={height - height / 4 + paddingTop}
          {...this.getPropsForBackgroundLines()}
        />
      );
    });
  };

  renderVerticalLine = config => {
    const { height, paddingTop, paddingRight } = config;
    return (
      <Line
        key={Math.random()}
        x1={Math.floor(paddingRight)}
        y1={0}
        x2={Math.floor(paddingRight)}
        y2={height - height / 4 + paddingTop}
        {...this.getPropsForBackgroundLines()}
      />
    );
  };

  renderLegend = config => {
    const { data, paddingRight } = config;
    //get radius for dot
    const { chartConfig = {}} = this.props
    const { propsForDots = {}, labelColor = () => '#000000' } = chartConfig;
    const { r = '6' } = propsForDots
    const radius = parseInt(r, 10)
    return (
      <View>
        {data.map((dataset, index) => dataset.legend && (
          <View key={index.toString()} style={[styles.legendContainer, {marginLeft: paddingRight}]}>
            <View style={{backgroundColor: this.getColor(dataset, 1), width: radius * 2, height: radius * 2, borderRadius: radius}}/>
            <RNText style={[styles.legend, {color: labelColor()}]}>{dataset.legend}</RNText>
          </View>
        ))}
      </View>
    )
  };


  renderDefs = config => {
    const {
      width,
      height,
      backgroundGradientFrom,
      backgroundGradientTo
    } = config;
    const fromOpacity = config.hasOwnProperty("backgroundGradientFromOpacity")
      ? config.backgroundGradientFromOpacity
      : 1.0;
    const toOpacity = config.hasOwnProperty("backgroundGradientToOpacity")
      ? config.backgroundGradientToOpacity
      : 1.0;

    const fillShadowGradient = config.hasOwnProperty("fillShadowGradient")
      ? config.fillShadowGradient
      : this.props.chartConfig.color();

    const fillShadowGradientOpacity = config.hasOwnProperty(
      "fillShadowGradientOpacity"
    )
      ? config.fillShadowGradientOpacity
      : 0.1;

    return (
      <Defs>
        <LinearGradient
          id="backgroundGradient"
          x1="0"
          y1={height}
          x2={width}
          y2={0}
        >
          <Stop
            offset="0"
            stopColor={backgroundGradientFrom}
            stopOpacity={fromOpacity}
          />
          <Stop
            offset="1"
            stopColor={backgroundGradientTo}
            stopOpacity={toOpacity}
          />
        </LinearGradient>
        <LinearGradient
          id="fillShadowGradient"
          x1={0}
          y1={0}
          x2={0}
          y2={height}
        >
          <Stop
            offset="0"
            stopColor={fillShadowGradient}
            stopOpacity={fillShadowGradientOpacity}
          />
          <Stop offset="1" stopColor={fillShadowGradient} stopOpacity="0" />
        </LinearGradient>
      </Defs>
    );
  };
}

const styles = StyleSheet.create({
  legendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
  },
  legend: {
    paddingLeft: 6,
    fontSize: 16,
  },
});

export default AbstractChart;
