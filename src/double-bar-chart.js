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

  getDatas = data =>
    data.reduce((acc, item) => (item.data ? [...acc, ...item.data] : acc), []);

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
    const { barPercentage = 0.5 } = this.props.chartConfig;
    return barPercentage * 32;
  };

  getBarX = (config, barWidth, dataLength, index, wuli) => {
    const { data, width, paddingRight, paddingLeft, side = "left" } = config;
    const offset = side === "right" ? barWidth/2 : (0-barWidth/2)
    return paddingRight +
            ((index+0.5) * (width - paddingRight - paddingLeft)) / dataLength -
            barWidth / 2 + offset
  }

  renderBars = config => {
    const { dataset, width, height, paddingTop, paddingRight, paddingLeft, side = "left" } = config;
    const { data } = dataset;
    const baseHeight = this.calcBaseHeight(data, height);
    return data.map((x, i) => {
      const barHeight = this.calcHeight(x, data, height);
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
    const { dataset, width, height, paddingTop, paddingRight, paddingLeft, side = "left" } = config;
    const { data } = dataset;
    const baseHeight = this.calcBaseHeight(data, height);
    return data.map((x, i) => {
      const barHeight = this.calcHeight(x, data, height);
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
      verticalLabelRotation = 90,
      horizontalLabelRotation = 0,
      yAxisLabelCount = 4,
      backgroundColor,
      formatYLabel = yLabel => yLabel,
      formatXLabel = xLabel => xLabel,
      chartConfig = {}
    } = this.props;

    const {
      strokeWidth = 1,
    } = chartConfig

    const { labels = [] } = data;
    const {
      borderRadius = 0,
      paddingTop = 16,
      paddingRight = 64,
      paddingLeft = 64,
      margin = 0,
      marginRight = 0,
      paddingBottom = 32,
    } = style;
    const config = {
      width,
      height,
      verticalLabelRotation,
      horizontalLabelRotation,
      horizontalOffset: -20,
    };
    const datas = this.getDatas(data.datasets);
    return (
      <View style={[style, {backgroundColor}]}>
        <Svg
          height={height + paddingBottom}
          width={width - margin * 2 - marginRight + strokeWidth}
        >
          <G>
            {this.renderDefs({
              ...config,
              ...chartConfig
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
                    data: data.datasets[0].data,
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
                    data: data.datasets[1].data,
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
                    formatXLabel,
                    position: 'center',
                  })
                : null}
            </G>
            <G>
              {this.renderBars({
                ...config,
                dataset: data.datasets[0],
                side: 'left',
                paddingTop,
                paddingRight,
                paddingLeft
              })}
            </G>
            <G>
              {this.renderBarTops({
                ...config,
                dataset: data.datasets[0],
                side: 'left',
                paddingTop,
                paddingRight,
                paddingLeft
              })}
            </G>
            <G>
              {this.renderBars({
                ...config,
                dataset: data.datasets[1],
                side: 'right',
                paddingTop,
                paddingRight,
                paddingLeft
              })}
            </G>
            <G>
              {this.renderBarTops({
                ...config,
                dataset: data.datasets[1],
                side: 'right',
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
