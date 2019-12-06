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
const MONTH_LABEL_GUTTER_SIZE = 8;
const paddingLeft = 32;

//TODO: FACTOR BELOW CODE OUT
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
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

  getSquareSizeWithGutter() {
    return (this.props.squareSize || SQUARE_SIZE) + this.props.gutterSize;
  }

  getMonthLabelSize() {
    let { squareSize = SQUARE_SIZE } = this.props;
    if (!this.props.showMonthLabels) {
      return 0;
    }
    if (this.props.horizontal) {
      return squareSize + MONTH_LABEL_GUTTER_SIZE;
    }
    return 2 * (squareSize + MONTH_LABEL_GUTTER_SIZE);
  }

  getStartDate() {
    return shiftDate(this.getEndDate(), -this.props.numDays + 1); // +1 because endDate is inclusive
  }

  getEndDate() {
    return getBeginningTimeForDate(convertToDate(this.props.endDate));
  }

  getStartDateWithEmptyDays() {
    return shiftDate(this.getStartDate(), -this.getNumEmptyDaysAtStart());
  }

  getNumEmptyDaysAtStart() {
    return this.getStartDate().getDay();
  }

  getNumEmptyDaysAtEnd() {
    return DAYS_IN_WEEK - 1 - this.getEndDate().getDay();
  }

  getXLabels(dataset) {
    return Array.from(new Set(this.props.xLabels || dataset.map(datasetElement => datasetElement.xLabel)))
  }

  getYLabels(dataset) {
    return Array.from(new Set(this.props.yLabels || dataset.map(datasetElement => datasetElement.yLabel)))
  }

  getWeekCount() {
    const numDaysRoundedToWeek =
      this.props.numDays +
      this.getNumEmptyDaysAtStart() +
      this.getNumEmptyDaysAtEnd();
    return Math.ceil(numDaysRoundedToWeek / DAYS_IN_WEEK);
  }

  getWeekWidth() {
    return DAYS_IN_WEEK * this.getSquareSizeWithGutter();
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

  getMonthLabelCoordinates(weekIndex) {
    if (this.props.horizontal) {
      return [
        weekIndex * this.getSquareSizeWithGutter(),
        this.getMonthLabelSize() - MONTH_LABEL_GUTTER_SIZE
      ];
    }
    const verticalOffset = -2;
    return [
      0,
      (weekIndex + 1) * this.getSquareSizeWithGutter() + verticalOffset
    ];
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
    const { yLabelsOffset = 4, yLabelTransformationMap, style = {} } = this.props;
    let {
      paddingRight = 64,
    } = config;

    return this.state.yLabels.map((yLabel, i) => {

      const x = paddingRight - yLabelsOffset;
      const y = (i + 0.55) * this.getSquareSizeWithGutter();
      if (yLabelTransformationMap) {
        yLabel = yLabelTransformationMap[yLabel.toString()]
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

  //TODO start: current implementattion is hacky, use D3 instead

  

  convertDateToFormattedString(datasetElement, currentPeriod) {
    let date = new Date(datasetElement);
    switch (currentPeriod) {
      case 'day':
        return DAYS[date.getDay()];
      case 'week':
        return date.getMonth() + '-' + date.getDate();
      case 'month':
        return date.getMonth() + '-' + date.getDate();
    }
  }

  getLabelScaling(currentPeriod) {
    switch (currentPeriod) {
      case 'day':
        return 2;
      case 'week':
        return 3;
      case 'month':
        return 3;
    }
  }

  renderTimeLabels() {
    const {currentPeriod} = this.props

    return _.range(this.state.xLabels.length).map(columnIndex => {
      const [x, y_] = this.getTransformForColumn(columnIndex);
      const [x_, y] = this.getSquareCoordinates(5);
      if (columnIndex%(this.getLabelScaling(currentPeriod))===0) {
        return (
          <Text
            origin={`${x}, ${y}`}
            key={Math.random()}
            x={x}
            y={y}

            {...this.getPropsForLabels()}
          >
            {this.convertDateToFormattedString(this.state.xLabels[columnIndex], currentPeriod)}
          </Text>
        );
      }
    });
    /*if (!this.props.showMonthLabels) {
      return null;
    }
    const weekRange = _.range(this.getWeekCount() - 1); // don't render for last week, because label will be cut off
    return weekRange.map(weekIndex => {
      const endOfWeek = shiftDate(
        this.getStartDateWithEmptyDays(),
        (weekIndex + 1) * DAYS_IN_WEEK
      );
      const [x, y] = this.getMonthLabelCoordinates(weekIndex);
      return endOfWeek.getDate() >= 1 && endOfWeek.getDate() <= DAYS_IN_WEEK ? (
        <Text
          key={weekIndex}
          x={x + paddingLeft}
          y={y + 8}
          {...this.getPropsForLabels()}
        >
          {MONTH_LABELS[endOfWeek.getMonth()]}
        </Text>
      ) : null;
    });*/
  }
  //TODO: end

  getColorForIndex(rowIndex, columnIndex) {
    const { valueConfig } = this.props;
    const value = this.getValueForCoordinates(rowIndex, columnIndex);
    if (valueConfig) {
      return valueConfig[value ? value.toString() : 'null'].color
    }

    const opacity = (value * 0.15 > 1 ? 1 : value * 0.15) + 0.15;
    return this.props.chartConfig.color(opacity);
  }

  renderLegend = () => {
    const { valueConfig, chartConfig = {}} = this.props;

    //get radius for dot
    const { propsForDots = {}, labelColor = () => '#000000' } = chartConfig;
    const { r = '6' } = propsForDots
    const radius = parseInt(r, 10)
    return (
      <View>
        {Object.keys(valueConfig).map((value, index) => valueConfig[value].legend && (
          <View key={index.toString()} style={styles.legendContainer}>
            <View style={{backgroundColor: valueConfig[value].color, width: radius * 2, height: radius * 2, borderRadius: radius}}/>
            <NativeText style={[styles.legend, {color: labelColor()}]}>{valueConfig[value].legend}</NativeText>
          </View>
        ))}
      </View>
    )
    return output;
  };

  render() {
    const { yLabels } = this.state;
    const { style = {}, backgroundColor, squareSize = SQUARE_SIZE, height, width } = this.props;
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
        {this.renderLegend()}
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
