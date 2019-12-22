import React from "react";
import PropTypes from "prop-types";
import { View, StyleSheet, Text as NativeText } from "react-native";
import { Svg, G, Text, Rect } from "react-native-svg";
import _ from "lodash";
import AbstractChart from "../abstract-chart";
import {
  DAYS_IN_WEEK,
  MILLISECONDS_IN_ONE_DAY,
  MONTH_LABELS
} from "./constants";
import {
  shiftDate,
  getBeginningTimeForDate,
  convertToDate
} from "./dateHelpers";

const SQUARE_SIZE = 20;

class HeatmapGraph extends AbstractChart {
  constructor(props) {
    super(props);
    this.state = {
      dataset: props.dataset,
      yLabels: this.getYLabels(props.dataset),
      xLabels: this.getXLabels(props.dataset),
    };
  }

  componentWillReceiveProps(nextProps) {
    if (JSON.stringify(this.props.dataset) !== JSON.stringify(nextProps.dataset)) {
      this.setState({
        dataset: nextProps.dataset,
        yLabels: this.getYLabels(nextProps.dataset),
        xLabels: this.getXLabels(nextProps.dataset),
      });
    }
  }

  getColor = (dataset, opacity) => {
    return dataset.color || this.props.chartConfig.color;
  };

  getSquareSizeWithGutter() {
    return (this.props.squareSize || SQUARE_SIZE) + this.props.gutterSize;
  }

  getXLabels(dataset) {
    const {xLabelsConfig = {}} = this.props;
    const {xLabels} = xLabelsConfig
    return Array.from(new Set(xLabels || dataset.map(datasetElement => datasetElement.xLabel)))
  }

  getYLabels(dataset) {
    const {yLabelsConfig = {}} = this.props;
    const {yLabels} = yLabelsConfig
    return Array.from(new Set(yLabels || dataset.map(datasetElement => datasetElement.yLabel)))
  }

  getValueForCoordinates(rowIndex, columnIndex) {
    const { yLabels, xLabels } = this.state;
    for (const datasetElement of this.state.dataset){
      if (yLabels[rowIndex] === datasetElement.yLabel && 
        xLabels[columnIndex] === datasetElement.xLabel
      ) {
        return datasetElement.value
      }
    }
    return null;
  }

  getColorForIndex(rowIndex, columnIndex) {
    const { valueConfig } = this.props;
    const value = this.getValueForCoordinates(rowIndex, columnIndex);
    if (valueConfig) {
      return valueConfig[value ? value.toString() : 'null'].color
    }

    const opacity = (value * 0.15 > 1 ? 1 : value * 0.15) + 0.15;
    return this.props.chartConfig.color(opacity);
  }

  getTitleForIndex(index) {
    if (this.state.dataset[index]) {
      return this.state.dataset[index].title;
    }
    return this.props.titleForValue ? this.props.titleForValue(null) : null;
  }

  getTooltipDataAttrsForIndex(index) {
    if (this.state.dataset[index]) {
      return this.state.dataset[index].tooltipDataAttrs;
    }
    return this.getTooltipDataAttrsForValue({ date: null, count: null });
  }

  getTooltipDataAttrsForValue(value) {
    const { tooltipDataAttrs } = this.props;

    if (typeof tooltipDataAttrs === "function") {
      return tooltipDataAttrs(value);
    }
    return tooltipDataAttrs;
  }

  getTransformForColumn(rowIndex) {
    if (this.props.horizontal) {
      return [rowIndex * this.getSquareSizeWithGutter(), 30];
    }
    return [10, rowIndex * this.getSquareSizeWithGutter()];
  }

  getSquareCoordinates(rowIndex) {
    if (this.props.horizontal) {
      return [0, rowIndex * this.getSquareSizeWithGutter()];
    }
    return [rowIndex * this.getSquareSizeWithGutter(), 0];
  }

  renderSquare(rowIndex, columnIndex) {
    const [x, y] = this.getSquareCoordinates(rowIndex);
    const { squareSize = SQUARE_SIZE } = this.props;
    return (
      <Rect
        key={rowIndex.toString() + columnIndex.toString()}
        width={squareSize}
        height={squareSize}
        x={x}
        y={y}
        title={this.getTitleForIndex(rowIndex, columnIndex)}
        fill={this.getColorForIndex(rowIndex, columnIndex)}
        {...this.getTooltipDataAttrsForIndex(rowIndex, columnIndex)}
      />
    );
  }

  renderColumn(columnIndex) {
    const [x, y] = this.getTransformForColumn(columnIndex);
    return (
      <G key={columnIndex} x={x} y={y}>
        {_.range(this.state.yLabels.length).map(rowIndex =>
          this.renderSquare(rowIndex, columnIndex)
        )}
      </G>
    );
  }

  renderAllColumns() {
    return _.range(this.state.xLabels.length).map(columnIndex =>
      this.renderColumn(columnIndex)
    );
  }

  renderAllHorizontalLabels(config) {
    const { yLabelsOffset = 4, yLabelsConfig, style = {} } = this.props;
    const {transformationMap = {}} = yLabelsConfig;
    let {
      paddingRight = 64,
    } = config;

    return this.state.yLabels.map((yLabel, i) => {

      const x = paddingRight - yLabelsOffset;
      const y = (i + 0.55) * this.getSquareSizeWithGutter();
      if (transformationMap) {
        yLabel = transformationMap[yLabel.toString()]
      }
      return(
        <Text
          origin={`${x}, ${y}`}
          key={Math.random()}
          x={x}
          y={y}
          textAnchor="end"
          {...this.getPropsForLabels()}
        >
          {yLabel}
        </Text>
      )
    });
  };

  renderHorizontalLabelsWithoutScaling(config) {
    const [x, y] = this.getTransformForColumn(0);
    return (
      <G x={x} y={y}>
        {this.renderAllHorizontalLabels(config)}
      </G>
    );
  }

  //textAnchor="center" is taken out because it would cause a crush on android
  renderTimeLabels() {
    const {xLabelScaling} = this.props

    return this.state.xLabels.map((xLabel, index) => {
      const [x, y_] = this.getTransformForColumn(index);
      const [x_, y] = this.getSquareCoordinates(this.state.yLabels.length + 2);
      if (index%xLabelScaling===0) {
        return (
          <Text
            origin={`${x}, ${y}`}
            key={Math.random()}
            x={x}
            y={y}
            {...this.getPropsForLabels()}
          >
            {xLabel}
          </Text>
        );
      }
    });
  }

  getColorForIndex(rowIndex, columnIndex) {
    const { valueConfig } = this.props;
    const value = this.getValueForCoordinates(rowIndex, columnIndex);
    if (valueConfig) {
      return valueConfig[value ? value.toString() : 'null'].color
    }

    const opacity = (value * 0.15 > 1 ? 1 : value * 0.15) + 0.15;
    return this.props.chartConfig.color(opacity);
  }

  render() {
    const { yLabels } = this.state;
    const { style = {}, backgroundColor, squareSize = SQUARE_SIZE, height, width, valueConfig = {} } = this.props;
    let {
      borderRadius = 0,
      paddingRight = 64,
    } = style;
    if (!borderRadius && this.props.chartConfig.style) {
      const stupidXo = this.props.chartConfig.style.borderRadius;
      borderRadius = stupidXo;
    }

    const chartWidth = squareSize * this.state.xLabels.length + paddingRight * 2
    const config = {
      chartWidth,
      height,
    };

    return (
      <View style={[style, {backgroundColor}]}>
        <Svg height={height} width={Math.max(chartWidth, width) }>
          {this.renderDefs({
            width: chartWidth,
            height: height,
            ...this.props.chartConfig
          })}
          <Rect
            width="100%"
            height={height}
            rx={borderRadius}
            ry={borderRadius}
            fill={backgroundColor}
          />
          {this.renderHorizontalLabelsWithoutScaling({
            paddingRight
          })}
          <G x={paddingRight}>{this.renderTimeLabels()}</G>
          <G x={paddingRight}>{this.renderAllColumns()}</G>
        </Svg>
        {this.renderLegend({
          data: Object.keys(valueConfig).map((key)=> valueConfig[key]),
          paddingRight
        })}
      </View>
    );
  }
}

HeatmapGraph.ViewPropTypes = {
  values: PropTypes.arrayOf(
    // array of objects with date and arbitrary metadata
    PropTypes.shape({
      date: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
        PropTypes.instanceOf(Date)
      ]).isRequired
    }).isRequired
  ).isRequired,
  numDays: PropTypes.number, // number of days back from endDate to show
  endDate: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.instanceOf(Date)
  ]), // end of date range
  gutterSize: PropTypes.number, // size of space between squares
  squareSize: PropTypes.number, // size of squares
  horizontal: PropTypes.bool, // whether to orient horizontally or vertically
  showMonthLabels: PropTypes.bool, // whether to show month labels
  showOutOfRangeDays: PropTypes.bool, // whether to render squares for extra days in week after endDate, and before start date
  tooltipDataAttrs: PropTypes.oneOfType([PropTypes.object, PropTypes.func]), // data attributes to add to square for setting 3rd party tooltips, e.g. { 'data-toggle': 'tooltip' } for bootstrap tooltips
  titleForValue: PropTypes.func, // function which returns title text for value
  classForValue: PropTypes.func, // function which returns html class for value
  onClick: PropTypes.func // callback function when a square is clicked
};

HeatmapGraph.defaultProps = {
  numDays: 200,
  endDate: new Date(),
  gutterSize: 1,
  squareSize: SQUARE_SIZE,
  horizontal: true,
  showMonthLabels: true,
  showOutOfRangeDays: false,
  classForValue: value => (value ? "black" : "#8cc665")
};

const styles = StyleSheet.create({
  legendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    marginLeft: 60,
  },
  legend: {
    paddingLeft: 6,
    fontSize: 16,
  },
});

export default HeatmapGraph;
