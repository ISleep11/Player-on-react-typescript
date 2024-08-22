import * as d3 from "d3";
import { IOptions } from "./interface";

class Drawer {
  private buffer: AudioBuffer; // store for decoded audio

  private parent: HTMLElement; // future wave container

  constructor(buffer: AudioBuffer, parent: HTMLElement) {
    this.buffer = buffer; // receive decoded audio and save it in the buffer
    this.parent = parent; // receive future wave container and save it in the parent
  }

  private getTimeDomain() {
    const step = 30; // time marks | every 30 seconds
    const steps = Math.ceil(this.buffer.duration / step); // amount of steps

    return [...new Array(steps)].map((_, index) => {
      const date = new Date(1970, 0, 1, 0, 0, 0, 0);
      date.setSeconds(index * step);

      let minutes = date.getMinutes().toString();
      if (minutes.length === 1) {
        // for better minutes:seconds display
        minutes = `0${minutes}`;
      }

      let seconds = date.getSeconds().toString();
      if (seconds.length === 1) {
        // for better minutes:seconds display
        seconds = `0${seconds}`;
      }

      return `${minutes}:${seconds}`; // for better minutes:seconds display
    });
  }

  public generateWaveform(
    audioData: number[],
    options: IOptions // need to describe interface
  ) {
    const {
      margin = { top: 0, bottom: 0, left: 0, right: 0 },
      height = this.parent.clientHeight,
      width = this.parent.clientWidth,
      padding = 1,
    } = options;

    const domain = d3.extent(audioData);

    const xScale = d3
      .scaleLinear() // create lineal scale for x
      .domain([0, audioData.length - 1]) // set data range for x
      .range([margin.left, width - margin.right]); // set display range for x

    const yScale = d3
      .scaleLinear() // create lineal scale for y
      .domain(domain.map((i) => Number(i))) // set data range for y
      .range([margin.top, height - margin.bottom]); // set display range for y

    const svg = d3.create("svg");

    svg
      .style("width", this.parent.clientWidth)
      .style("height", this.parent.clientHeight)
      .style("display", "block");

    svg // const grid = svg
      .append("g") // add group "g" for grid
      .attr("stroke-width", 0.5) // grid lines width
      .attr("stroke", "#a6d6d6") // grid lines color
      .call(
        (g) =>
          g
            .append("g") // add group "g" for x-part of grid (vertical lines)
            .selectAll("line")
            .data(xScale.ticks()) // use xScale data to create lines
            .join("line") // bring together all data and create lines
            .attr("x1", (d: d3.NumberValue) => 0.5 + xScale(d)) // start x (if we used ".data()" - we can now use xScale and it will automatically consider what x coordinates should be)
            .attr("x2", (d: d3.NumberValue) => 0.5 + xScale(d)) // end x
            .attr("y1", 0) // start y (from up to down)
            .attr("y2", this.parent.clientHeight) // end y
      )
      .call(
        (g) =>
          g
            .append("g") // add group "g" for y-part of grid (horizontal lines)
            .selectAll("line")
            .data(yScale.ticks()) // use yScale data to create lines
            .join("line") // bring together all data and create lines
            .attr("y1", (d: d3.NumberValue) => yScale(d)) // start y
            .attr("y2", (d: d3.NumberValue) => yScale(d)) // end y
            .attr("x1", 0) // start x
            .attr("x2", this.parent.clientWidth) // end x
      );

    svg
      .append("rect") // add a rect
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "rgba(255, 255, 255, 0)"); // rect is transparent

    const g = svg
      .append("g") // new group
      .attr("transform", `translate(0, ${height / 2})`) // group now is vertically centered
      .attr("fill", "#03A300");

    const band = (width - margin.left - margin.right) / audioData.length; // width of each graphic column

    g.selectAll("rect")
      .data(audioData) // connect audio data to rects
      .join("rect") // bring together data and create rects
      .attr("fill", "#a6d6d6")
      .attr("height", (d) => yScale(d))
      .attr("width", () => band * padding)
      .attr("x", (_, i) => xScale(i)) // x position (i - index of element, that is passed to ".data()")
      .attr("y", (d) => -yScale(d) / 2) // y position (we use "-" for the graphic to be vertically symetrical)
      .attr("rx", band / 2) // round angles of rect (x)
      .attr("ry", band / 2); // round angles of rect (y)

    const bands = this.getTimeDomain(); // time mark

    const bandScale = d3
      .scaleBand() // create band scale (it divides the range into equal intervals)
      .domain(bands) // set time marks
      .range([margin.top, this.parent.clientWidth]); // display range of the band scale

    svg
      .append("g") // group for time scale
      // eslint-disable-next-line @typescript-eslint/no-shadow
      .call((g) => g.select(".domain").remove()) // !!! why !!!
      .attr("stroke-width", 0) // tracings width
      .style("color", "#f5f5f5")
      .style("font-size", 11)
      .style("font-wight", 400)
      .style("opacity", "60%")
      .call(d3.axisBottom(bandScale.copy())); // creates bottom axis with marks' positions "bandScale"

    // const progressLine = svg
    //   .append("line")
    //   .attr("x1", margin.left)
    //   .attr("y1", margin.top)
    //   .attr("x2", margin.left)
    //   .attr("y2", height - margin.bottom)
    //   .attr("stroke", "#FF0000")
    //   .attr("stroke-width", 2);

    return svg;
  }

  public clearData() {
    const rawData = this.buffer.getChannelData(0); // We only need to work with one channel of data
    const samples = this.buffer.sampleRate; // Number of samples we want to have in our final data set
    const blockSize = Math.floor(rawData.length / samples); // the number of samples in each subdivision
    const filteredData = [];
    for (let i = 0; i < samples; i += 1) {
      const blockStart = blockSize * i; // the location of the first sample in the block
      let sum = 0;
      for (let j = 0; j < blockSize; j += 1) {
        sum += Math.abs(rawData[blockStart + j]); // find the sum of all the samples in the block
      }
      filteredData.push(sum / blockSize); // divide the sum by the block size to get the average
    }
    const multiplier = Math.max(...filteredData) ** -1;
    return filteredData.map((n) => n * multiplier);
  }

  public init() {
    const audioData = this.clearData();
    const node = this.generateWaveform(audioData, {});
    this.parent.appendChild(node.node() as Element);
  }
}

export default Drawer;
