import React from "react";
import { View } from "react-native";
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

class DoubleBarChart extends AbstractChart {
  getColor = (dataset, opacity) => {
    return (dataset.color || this.props.chartConfig.color)(opacity);
  };

  getDatas = data =>
    data.reduce((acc, item) => (item.data ? [...acc, ...item.data] : acc), []);

  getBarWidth = () => {
    const { barPercentage = 0.5 } = this.props.chartConfig;
    return barPercentage * 32;
  };

  getBarX = (config, barWidth, dataLength, index) => {
    const { data, width, paddingRight, paddingLeft, side = "left" } = config;
    const offset = side === "right" ? barWidth/2 : (0-barWidth/2)
    return paddingRight +
            ((index+0.5) * (width - paddingRight - paddingLeft)) / dataLength -
            barWidth / 2 + offset
  }

  renderBars = config => {
    const { dataset, width, height, paddingTop, paddingRight, paddingLeft, side = "left" } = config;
    const {data, maxValue} = dataset;
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
    const { dataset, width, height, paddingTop, paddingRight, paddingLeft, side = "left" } = config;
    const {data, maxValue} = dataset;
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
          width={width - margin * 2 - marginRight}
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
           paddingRight,
        })}
      </View>
    );
  }
}

export default DoubleBarChart;
