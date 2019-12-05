import React from "react";
import { View, Text, StyleSheet } from "react-native";
import {
  Svg,
  Circle,
  Polygon,
  Polyline,
  Path,
  Rect,
  G,
} from "react-native-svg";
import AbstractChart from "./abstract-chart";

class LineBarChart extends AbstractChart {
  getColor = (dataset, opacity) => {
    return (dataset.color || this.props.chartConfig.color)(opacity);
  };

  getStrokeWidth = dataset => {
    return dataset.strokeWidth || this.props.chartConfig.strokeWidth || 3;
  };

  getDatas = data =>
    data.reduce((acc, item) => (item.data ? [...acc, ...item.data] : acc), []);

  getAvailableWidth = config => {
    const {
      width,
      paddingRight,
      paddingLeft,
    } = config;
    return width - paddingRight - paddingLeft;
  }

  getPropsForDots = (x, i) => {
    const { getDotProps, chartConfig = {} } = this.props;
    if (typeof getDotProps === "function") {
      return getDotProps(x, i);
    }
    const { propsForDots = {} } = chartConfig;
    return { r: "4", ...propsForDots };
  };

  renderDots = config => {
    const {
      dataset,
      width,
      height,
      paddingTop,
      paddingRight,
      paddingLeft,
      onDataPointClick
    } = config;
    const output = [];
    const {data, maxValue} = dataset;
    const baseHeight = this.calcBaseHeight(data, height);
    const availableWidth = this.getAvailableWidth(config);
    const { getDotColor, hidePointsAtIndex = [] } = this.props;

    data.forEach((x, i) => {
      if (hidePointsAtIndex.includes(i)) {
        return;
      }
      const cx =
        paddingRight + (i + 0.5) * availableWidth / data.length;
      const cy =
        ((baseHeight - this.calcHeight(x, data, height, maxValue)) / 4) * 3 +
        paddingTop;
      const onPress = () => {
        if (!onDataPointClick || hidePointsAtIndex.includes(i)) {
          return;
        }

        onDataPointClick({
          index: i,
          value: x,
          dataset,
          x: cx,
          y: cy,
          getColor: opacity => this.getColor(dataset, opacity)
        });
      };

      output.push(
        <Circle
          key={Math.random()}
          cx={cx}
          cy={cy}
          fill={
            typeof getDotColor === "function"
              ? getDotColor(x, i)
              : this.getColor(dataset, 0.9)
          }
          onPress={onPress}
          {...this.getPropsForDots(x, i)}
        />,
        <Circle
          key={Math.random()}
          cx={cx}
          cy={cy}
          r="12"
          fill="#fff"
          fillOpacity={0}
          onPress={onPress}
        />
      );
    });

    return output;
  };

  renderShadow = config => {
    const { dataset, width, height, paddingRight, paddingLeft, paddingTop } = config;
    const {data, maxValue} = dataset;
    const baseHeight = this.calcBaseHeight(data, height);
    const availableWidth = this.getAvailableWidth(config);
    return (
      <Polygon
        points={
          data
            .map((d, i) => {
              const x =
                paddingRight +
                (i + 0.5) * availableWidth / data.length;
              const y =
                ((baseHeight - this.calcHeight(d, data, height, maxValue)) / 4) * 3 +
                paddingTop;
              return `${x},${y}`;
            })
            .join(" ") +
          ` ${paddingRight +
            availableWidth / data.length *
              (data.length - 0.5)},${(height / 4) * 3 +
            paddingTop} ${paddingRight + availableWidth / data.length * 0.5},${(height / 4) * 3 + paddingTop}`
        }
        fill="url(#fillShadowGradient)"
        strokeWidth={0}
      />
    );
  };

  renderLine = config => {
    const { width, height, paddingRight, paddingLeft, paddingTop, dataset } = config;

    const {data, maxValue} = dataset;
    const baseHeight = this.calcBaseHeight(data, height);
    const availableWidth = this.getAvailableWidth(config);

    const points = data.map((d, i) => {
      const x =
        (i + 0.5) * availableWidth / data.length + paddingRight;
      const y =
        ((baseHeight - this.calcHeight(d, data, height, maxValue)) / 4) * 3 +
        paddingTop;
      return `${x},${y}`;
    });

    return (
      <Polyline
        points={points.join(" ")}
        fill="none"
        stroke={this.getColor(dataset, 0.2)}
        strokeWidth={this.getStrokeWidth(dataset)}
      />
    );
  };

  renderLegend = config => {
    const { data } = config;
    const datas = this.getDatas(data);
    //get radius for dot
    const { chartConfig = {}} = this.props
    const { propsForDots = {}, labelColor = () => '#000000' } = chartConfig;
    const { r } = propsForDots
    const radius = parseInt(r, 10)
    return (
      <View>
        {data.map((dataset, index) => dataset.legend && (
          <View style={styles.legendContainer}>
            <View style={{backgroundColor: this.getColor(dataset, 1), width: radius * 2, height: radius * 2, borderRadius: radius}}/>
            <Text style={[styles.legend, {color: labelColor()}]}>{dataset.legend}</Text>
          </View>
        ))}
      </View>
    )
    return output;
  };

  getBarWidth = () => {
    const { barPercentage = 0.6 } = this.props.chartConfig;
    return barPercentage * 32;
  };

  getBarX = (config, barWidth, dataLength, index, wuli) => {
    const { data, width, paddingRight, paddingLeft } = config;
    return paddingRight +
            ((index+0.5) * (width - paddingRight - paddingLeft)) / dataLength -
            barWidth / 2
  }

  renderBars = config => {
    const { dataset, width, height, paddingTop, paddingRight, paddingLeft } = config;
    const { data, maxValue } = dataset;
    const baseHeight = this.calcBaseHeight(data, height);
    return data.map((x, i) => {
      const barHeight = this.calcHeight(x, data, height, maxValue);
      const barWidth = this.getBarWidth();
      return (
        <Rect
          key={Math.random()}
          x={this.getBarX(config, barWidth, data.length, i)}
          y={
            ((barHeight > 0 ? baseHeight - barHeight : baseHeight) / 4) * 3 +
            paddingTop
          }
          width={barWidth}
          height={(Math.abs(barHeight) / 4) * 3}
          fill={this.getColor(dataset, 0.35)}
        />
      );
    });
  };

  renderBarTops = config => {
    const { dataset, width, height, paddingTop, paddingRight, paddingLeft } = config;
    const { data, maxValue } = dataset;
    const baseHeight = this.calcBaseHeight(data, height);
    return data.map((x, i) => {
      const barHeight = this.calcHeight(x, data, height, maxValue);
      const barWidth = this.getBarWidth();
      return (
        <Rect
          key={Math.random()}
          x={this.getBarX(config, barWidth, data.length, i)}
          y={((baseHeight - barHeight) / 4) * 3 + paddingTop}
          width={barWidth}
          height={2}
          fill={this.getColor(dataset, 1)}
        />
      );
    });
  };

  render() {
    const {
      width,
      height,
      data,
      withShadow = true,
      withDots = true,
      withInnerLines = true,
      withOuterLines = true,
      withHorizontalLabels = true,
      withVerticalLabels = true,
      style = {},
      onDataPointClick,
      verticalLabelRotation = 0,
      horizontalLabelRotation = 0,
      yAxisLabelCount = 4,
      backgroundColor,
      formatYLabel = yLabel => yLabel,
      formatXLabel = xLabel => xLabel
    } = this.props;
    const { labels = [] } = data;
    const {
      borderRadius = 0,
      paddingTop = 16,
      paddingRight = 64,
      paddingLeft = 64,
      margin = 0,
      marginRight = 0,
      paddingBottom = 0,
    } = style;
    const config = {
      width,
      height,
      verticalLabelRotation,
      horizontalLabelRotation
    };
    const datas = this.getDatas(data.datasets);
    return (
      <View style={[style, {backgroundColor}]}>
        <Svg
          height={height + paddingBottom}
          width={width - margin * 2 - marginRight}
        >
          <G>
            {this.renderDefs({
              ...config,
              ...this.props.chartConfig
            })}
            <Rect
              width="100%"
              height={height}
              rx={borderRadius}
              ry={borderRadius}
              fill={backgroundColor}
            />
            <G>
              {withInnerLines
                ? this.renderHorizontalLines({
                    ...config,
                    count: yAxisLabelCount,
                    paddingTop,
                    paddingRight,
                    paddingLeft,
                  })
                : withOuterLines
                ? this.renderHorizontalLine({
                    ...config,
                    paddingTop,
                    paddingRight,
                    paddingLeft,
                  })
                : null}
            </G>
            <G>
              {withHorizontalLabels
                ? this.renderHorizontalLabels({
                    ...config,
                    count: Math.min(...datas) === Math.max(...datas) ? 1 : yAxisLabelCount,
                    dataset: data.datasets[0],
                    side: 'left',
                    paddingTop,
                    paddingRight,
                    paddingLeft,
                    formatYLabel
                  })
                : null}
            </G>
            <G>
              {withHorizontalLabels
                ? this.renderHorizontalLabels({
                    ...config,
                    count: Math.min(...datas) === Math.max(...datas) ? 1 : yAxisLabelCount,
                    dataset: data.datasets[1],
                    side: 'right',
                    paddingTop,
                    paddingRight,
                    paddingLeft,
                    formatYLabel
                  })
                : null}
            </G>
            <G>
              {withInnerLines
                ? this.renderVerticalLines({
                    ...config,
                    data: data.datasets[0].data,
                    paddingTop,
                    paddingRight,
                    paddingLeft,
                  })
                : withOuterLines
                ? this.renderVerticalLine({
                    ...config,
                    paddingTop,
                    paddingRight,
                    paddingLeft,
                  })
                : null}
            </G>
            <G>
              {withVerticalLabels
                ? this.renderVerticalLabels({
                    ...config,
                    labels,
                    paddingRight,
                    paddingLeft,
                    paddingTop,
                    formatXLabel
                  })
                : null}
            </G>
            <G>
              {this.renderLine({
                ...config,
                paddingRight,
                paddingLeft,
                paddingTop,
                dataset: data.datasets[1]
              })}
            </G>
            <G>
              {withShadow &&
                this.renderShadow({
                  ...config,
                  dataset: data.datasets[1],
                  paddingRight,
                  paddingLeft,
                  paddingTop
                })}
            </G>
            <G>
              {withDots &&
                this.renderDots({
                  ...config,
                  dataset: data.datasets[1],
                  paddingTop,
                  paddingRight,
                  paddingLeft,
                  onDataPointClick
                })}
            </G>
            <G>
              {this.renderBars({
                ...config,
                dataset: data.datasets[0],
                paddingTop,
                paddingRight,
                paddingLeft
              })}
            </G>
            <G>
              {this.renderBarTops({
                ...config,
                dataset: data.datasets[0],
                paddingTop,
                paddingRight,
                paddingLeft
              })}
            </G>
          </G>
        </Svg>
        {this.renderLegend({
           data: data.datasets,
        })}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  legendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    marginLeft: 60
  },
  legend: {
    paddingLeft: 6,
    fontSize: 16,
  },
});

export default LineBarChart;
