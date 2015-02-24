
/* notification functions */
function flashNotice(string){
	$('#notice').html(string).show().fadeOut(3000);
}

function flashError(string){
	$('#notice').html("<span class='error'>"+string+"</span>").show().fadeOut(3000);
}


/* flot chart functions */
function requestPlotData(year,month){
	var filename ;
	if(year && month){
		filename = 'stats/'+year+"/"+month; 
	}else{
		filename = 'stats/'+moment().format('YYYY/MM'); 
	}
	$.ajax({
     		url: filename,
     		dataType: 'json',
     		success: function(data) {
			try {
				graphData = data;
			    plot();
			} catch(err) {
				console.error(filename, status, err.message);
				flashError("error parsing data for '"+filename+"' ! "+err.toString());
			}
     		}.bind(this),
     		error: function(xhr, status, err) {
       		console.error(filename, status, err.toString());
			flashError("error loading '"+filename+"' ! "+err.toString());
     		}.bind(this)
   	});
};

function plot(start,end) {
	if(!start){
		//start = graphData.time[0];
		start =  graphData.time[graphData.time.length-1]-12*60*60*1000;
	}
	if(!end){
		end =  graphData.time[graphData.time.length-1];
	}
	
	$.plot(
		"#placeholder",
		[
			{ label: "mode", data: graphData.timeseries[0] },
			{ label: "heating", data: graphData.timeseries[1] },
			{ label: "scheduled", data: graphData.timeseries[2] },
			{ label: "actual", data: graphData.timeseries[3] },
		],
		{
			legend:{           
				position: 'sw'
			},
			series: {
				lines: {show: true},
				points: {show: false}
			},
			grid: {
				hoverable: true,
				clickable: true,
				backgroundColor: { colors: ["#999999", "#777777"] }	
			},
			xaxis: { 
				mode: "time",
				min: start,
				max: end 
			}
		}
	);
	$("<div id='tooltip'></div>").css({
		position: "absolute",
		display: "none",
		border: "0px solid #666666",
		padding: "3px",
		color:'#999999',
		'background-color': "#dddddd",
		opacity: 0.80
	}).appendTo("body");

	$("#placeholder").bind("plothover", function (event, pos, item) {
		if (item) {
			//var x = item.datapoint[0].toFixed(2);
			var	y = item.datapoint[1].toFixed(2);
			$("#tooltip").html(item.series.label + " : " + y)
				.css({top: item.pageY+5, left: item.pageX+5})
				.fadeIn(200);
		} else {
			$("#tooltip").hide();
		}
	});
};

$("#oneDay").click(function () {
	var start = new Date()
	start.setDate(start.getDate()-1);
	plot((start).getTime());
});
$("#twoDays").click(function () {
	var start = new Date()
	start.setDate(start.getDate()-2);
	plot((start).getTime());
});
$("#sevenDays").click(function () {
	var start = new Date()
	start.setDate(start.getDate()-7);
	plot((start).getTime());
});
$("#allDays").click(function () {
	plot();
});


/*thermos UI */

var If = React.createClass({
    render: function() {
        if (this.props.test) {
            return this.props.children;
        } else {
            return false;
        }
    }
});

var JsonComponent = {

	getInitialState: function() {
    	return {};
  	},

	componentDidMount: function() {
    	this.load();
  	},

	unmount: function() {
	  var node = this.getDOMNode();
	  React.unmountComponentAtNode(node);
	  $(node).remove();
	},

  	load: function(){
		$.ajax({
      		url: this.props.url,
      		dataType: 'json',
      		success: function(data) {
				try {
				    this.setState(data);
				} catch(err) {
					console.error(this.props.url, status, err.message);
					flashError("error parsing data for "+this.props.name+" ! "+err.toString());
				}
      		}.bind(this),
      		error: function(xhr, status, err) {
        		console.error(this.props.url, status, err.toString());
				flashError("error loading "+this.props.name+" ! "+err.toString());
      		}.bind(this)
    	});
  	},

  	save: function() {
  		$.ajax({
    		url: this.props.url,
			data: JSON.stringify(this.state),
			method:'post',
			contentType: 'application/json',
    		dataType: 'json',
    		success: function(data) {
				flashNotice(this.props.name+" saved !");
    		}.bind(this),
    		error: function(xhr, status, err) {
      			console.error(this.props.url, status, err.toString());
				flashError("error saving "+this.props.name+" ! "+err.toString());
    		}.bind(this)
  		});
	}

};


var ConfigForm = React.createClass({
	
	mixins: [JsonComponent], 

	handleChange: function(event) {
		if(event.target.value && event.target.name=="manual_temperature")
			this.setState({'manual_temperature': event.target.value});
		if(event.target.value && event.target.name=="mode")
			this.setState({'mode': event.target.value});
		this.mustSave=true;
	},
	
  	render: function() {
		if(!this.state.mode){
			return(
			<div>
				Loading...
			</div>
			);
		}
		if(this.mustSave){
			this.save();
			this.mustSave=false;
		}
		var schedule_checked = this.state.mode=="schedule" ? true : false;
		var manual_checked = this.state.mode=="manual" ? true : false;
		var off_checked = this.state.mode=="off" ? true : false;
		var schedule_class = this.state.mode=="schedule" ? "button on" : "button off";
		var manual_class =  this.state.mode=="manual" ? "button on" : "button off";
		var off_class = this.state.mode=="off" ? "button on" : "button off";
		var manual_temperature = this.state.manual_temperature;
		var displayNone = {
			display: 'none'
		};
		//alert(JSON.stringify(this.state));
		return (
			<div>
					<input type="radio" style={displayNone} name='mode' value="schedule" id="mode_schedule" defaultChecked={schedule_checked} onChange={this.handleChange} />
					<label htmlFor="mode_schedule" className={schedule_class}>schedule</label>&nbsp;
					<input type="radio" style={displayNone} name='mode' value="manual" id="mode_manual" defaultChecked={manual_checked} onChange={this.handleChange}/>
					<label htmlFor="mode_manual" className={manual_class}>manual</label>&nbsp;
					<input type="radio" style={displayNone} name='mode' value="off" id="mode_off" defaultChecked={off_checked} onChange={this.handleChange}/>
					<label htmlFor="mode_off" className={off_class}>off</label>&nbsp;
					<If test={manual_checked}>
						<div>
							<br/>
							<label htmlFor='manual_temperature'>manual temperature</label>&nbsp;
							<input id="manual_temperature" name="manual_temperature" type="text" size="4" defaultValue={manual_temperature} onChange={this.handleChange}/>
						</div>
					</If>
			</div>
		 );
	  }
});


var Status = React.createClass({
	
	getInitialState: function() {
    	return {'refresh':true};
  	},

	load: function(){
		$.ajax({
      		url: this.props.url,
      		dataType: 'json',
      		success: function(data) {
				try {
					data.refresh = this.state.refresh;
					//if(refresh){
					setTimeout(this.load, 60*1000);
					//}
				    this.setState(data);
				} catch(err) {
					console.error(this.props.url, status, err.message);
					flashError("error parsing data for "+this.props.name+" ! "+err.toString());
				}
      		}.bind(this),
      		error: function(xhr, status, err) {
        		console.error(this.props.url, status, err.toString());
				flashError("error loading "+this.props.name+" ! "+err.toString());
      		}.bind(this)
    	});
	},
  
	componentDidMount: function() {
		this.load();
  	},

	toggleRefresh: function(event) {
    	this.setState({'days_of_the_week': daysOfTheWeek});
  	},

	render: function() {
		if(!this.state.mode){
			return(
			<div>
				Loading...
			</div>
			);
		}
		var mode = this.state.mode?this.state.mode :'unknown';
		var scheduled_temperature = this.state.scheduled_temperature?this.state.scheduled_temperature:'unknown';
		var current_temperature = this.state.current_temperature?this.state.current_temperature:'unknown';
		var heating = this.state.heating?"heating":'off';
		var active_schedule_entry = this.state.active_schedule_entry;
		var refresh = this.state.refresh;
		return (
			<div>
				<ul>
					<li key={current_temperature}>current temperature:{current_temperature}</li>
					<li key={heating}>heating: {heating}</li>
					<li key={mode}>mode: {mode}</li>
					<If test={mode!='off'}>
						<li>scheduled temperature: {scheduled_temperature}</li>
					</If>
					<If test={mode=='schedule'}>
						<li>current schedule: &nbsp;
							{active_schedule_entry?
								<ScheduleEntry 
									temperature={active_schedule_entry.temperature} 
									active={active_schedule_entry.active} 
									start_time={active_schedule_entry.start_time} 
									end_time={active_schedule_entry.end_time} 
									days_of_the_week={active_schedule_entry.days_of_the_week}
								/>
								:<span>None</span>
							}
						</li>
					</If>
				</ul>
			</div>
		 );
  	}
});




var ScheduleEntryForm = React.createClass({
	
	getInitialState: function() {
		if(this.props.data){
	  		return this.props.data;
		}else{
			return {
				'temperature':20,
				'active':true,
				'start_time':'18:00',
				'end_time':'22:00',
				'days_of_the_week': [0,1,2,3,4,5,6]
			};	
		}
	},

	unmount: function() {
	  var node = this.getDOMNode();
	  React.unmountComponentAtNode(node);
	  $(node).remove();
	},

	save: function() {
		if(this.props.index==-1)
  			this.props.parent.appendEntry(this.state);
		else
			this.props.parent.updateEntry(this.props.index, this.state);
		this.unmount();
	},
	
	setDaysOfTheWeek: function(daysOfTheWeek) {
    	this.setState({'days_of_the_week': daysOfTheWeek});
  	},

	toggleDay: function(day) {
		var days = this.state.days_of_the_week;
		var newDays = [];
		if(days.indexOf(day)<0){
			days.push(day);
			this.setState({'days_of_the_week': days});
		}else{
			for(i=0;i<days.length;i++){
				if(days[i]!=day){
					//keep
					newDays.push(days[i]);
				}
			}
			this.setState({'days_of_the_week': newDays});
		}
	},
	
	handleChange: function(event) {	
		if(event.target.value && event.target.name=="temperature")
			this.setState({'temperature': event.target.value});
		if(event.target.value && event.target.name=="active"){
			var active = ! this.state.active;
			this.setState({'active':active });
		}
		if(event.target.value && event.target.name=="start_time")
			this.setState({'start_time': event.target.value});
		if(event.target.value && event.target.name=="end_time")
			this.setState({'end_time': event.target.value});
	},
	
	render: function() {

		var now = new Date().getTime();
		var start_time = this.state.start_time;
		var end_time = this.state.end_time;
		var temperature = this.state.temperature;
		var active = this.state.active?"manual":"";
		var active_class = this.state.active?"button on" : "button off";
		var active_text = this.state.active?"active" : "inactive";
		var mon = this.state.days_of_the_week.indexOf(0)>=0?"mon":"";
		var tue = this.state.days_of_the_week.indexOf(1)>=0?"tue":"";
		var wed = this.state.days_of_the_week.indexOf(2)>=0?"wed":"";
		var thu = this.state.days_of_the_week.indexOf(3)>=0?"thu":"";
		var fri = this.state.days_of_the_week.indexOf(4)>=0?"fri":"";
		var sat = this.state.days_of_the_week.indexOf(5)>=0?"sat":"";
		var sun = this.state.days_of_the_week.indexOf(6)>=0?"sun":"";
		var mon_class = this.state.days_of_the_week.indexOf(0)>=0 ? "button on" : "button off";
		var tue_class = this.state.days_of_the_week.indexOf(1)>=0 ? "button on" : "button off";
		var wed_class = this.state.days_of_the_week.indexOf(2)>=0 ? "button on" : "button off";
		var thu_class = this.state.days_of_the_week.indexOf(3)>=0 ? "button on" : "button off";
		var fri_class = this.state.days_of_the_week.indexOf(4)>=0 ? "button on" : "button off";
		var sat_class = this.state.days_of_the_week.indexOf(5)>=0 ? "button on" : "button off";
		var sun_class = this.state.days_of_the_week.indexOf(6)>=0 ? "button on" : "button off";
		var displayNone = {
			display: 'none'
		};
		return(
		<div>
			<br/>
			<fieldset>
				<label htmlFor='active' className={active_class}>{active_text}</label>&nbsp;
				<input type="checkbox" style={displayNone} name="active" id="active" defaultChecked={active} key={"active"+active} onChange={this.handleChange} />
				<br/>
				<label htmlFor='temperature'>temperature</label>&nbsp;
				<input name="temperature" id="temperature" type="text" size="2" defaultValue={temperature} onChange={this.handleChange} size="5"/>
				&nbsp;&nbsp;&nbsp;&nbsp;
				<label htmlFor='start_time'>start</label>&nbsp;
				<input name="start_time" id="start_time" defaultValue={start_time} onChange={this.handleChange} size="5"/>
				&nbsp;&nbsp;&nbsp;&nbsp;
				<label htmlFor='end_time'>end</label>&nbsp;
				<input name="end_time" id="end_time" defaultValue={end_time} onChange={this.handleChange} size="5"/>
				<br/>
				days : &nbsp;
				<label htmlFor='weekdayMon' className={mon_class}>mon</label>
				<input type="checkbox" name="weekdayMon" id="weekdayMon" style={displayNone} defaultChecked={mon} key={"mon"+mon} onChange={this.toggleDay.bind(this,0)} />
				<label htmlFor='weekdayTue' className={tue_class}>tue</label>
				<input type="checkbox" name="weekdayTue" id="weekdayTue" style={displayNone} defaultChecked={tue} key={"tue"+tue} onChange={this.toggleDay.bind(this,1)} />
				<label htmlFor='weekdayWed' className={wed_class}>wed</label>
				<input type="checkbox" name="weekdayWed" id="weekdayWed" style={displayNone} defaultChecked={wed} key={"wed"+wed} onChange={this.toggleDay.bind(this,2)} />
				<label htmlFor='weekdayThu' className={thu_class}>thu</label>
				<input type="checkbox" name="weekdayThu" id="weekdayThu" style={displayNone} defaultChecked={thu} key={"thu"+thu} onChange={this.toggleDay.bind(this,3)} />
				<label htmlFor='weekdayFri' className={fri_class}>fri</label>
				<input type="checkbox" name="weekdayFri" id="weekdayFri" style={displayNone} defaultChecked={fri} key={"fri"+fri} onChange={this.toggleDay.bind(this,4)} />
				<label htmlFor='weekdaySat' className={sat_class}>sat</label>
				<input type="checkbox" name="weekdaySat" id="weekdaySat" style={displayNone} defaultChecked={sat} key={"sat"+sat} onChange={this.toggleDay.bind(this,5)} />
				<label htmlFor='weekdaySun' className={sun_class}>sun</label>
				<input type="checkbox" name="weekdaySun" id="weekdaySun" style={displayNone} defaultChecked={sun} key={"sun"+sun} onChange={this.toggleDay.bind(this,6)} />
				<br/>
				select : &nbsp;
				<a href="javascript:void(0)" onClick={this.setDaysOfTheWeek.bind(this,[0,1,2,3,4,5,6])}>all</a>&nbsp;
				<a href="javascript:void(0)" onClick={this.setDaysOfTheWeek.bind(this,[])}>none</a>&nbsp;
				<a href="javascript:void(0)" onClick={this.setDaysOfTheWeek.bind(this,[0,1,2,3,4])}>weekdays</a>&nbsp;
				<a href="javascript:void(0)" onClick={this.setDaysOfTheWeek.bind(this,[5,6])}>weekends</a>&nbsp;
				<br/><br/>
				<a href="javascript:void(0)" onClick={this.save} >save</a>&nbsp;&nbsp;
				<a href="javascript:void(0)" onClick={this.unmount} >cancel</a>
			</fieldset>
		</div>	
		);
	}
});





var Schedule = React.createClass({
	
	mixins: [JsonComponent],
	
	newEntry: function(){
		React.render(
		  <ScheduleEntryForm parent={this} index={-1} />,
		  document.getElementById('scheduleEntryForm')
		)
	},
	
	appendEntry: function(entry){
		var entries = this.state.entries;
		entries.push(entry);
		this.mustSave=true;
		this.setState({'entries': entries});
	},
	
	updateEntry: function(index,entry){
		var entries = [];
		for (var i=0; i < this.state.entries.length; i++) {
			if(i!=index){
				entries.push(this.state.entries[i]);
			}else{
				entries.push(entry);
			}
		}
		this.mustSave=true;
		this.setState({'entries': entries});
	},
	
	removeEntry: function(index){
		var entries = [];
		for (var i=0; i < this.state.entries.length; i++) {
			if(i!=index){
				entries.push(this.state.entries[i])
			}
		}
		this.mustSave=true;
		this.setState({'entries': entries});
	},
	
	editEntry: function(i){
		React.render(
		  <ScheduleEntryForm parent={this} index={i} data={this.state.entries[i]} />,
		  document.getElementById('scheduleEntryForm')
		)	
	},
	
	render: function() {
		if(this.mustSave){
			this.save();
			this.mustSave=false;
		}
		if(!this.state.entries){
			return(
			<div>
				<h2>Schedule</h2>
				Loading...
			</div>
			);
		}
		var rows = [];
		if(this.state.entries){
			for (var i=0; i < this.state.entries.length; i++) {
				var temperature = this.state.entries[i].temperature;
				var active = this.state.entries[i].active;
				var start_time = this.state.entries[i].start_time;
				var end_time = this.state.entries[i].end_time;
				var days_of_the_week = this.state.entries[i].days_of_the_week;
		    	rows.push(
					<li key={i}>
						<ScheduleEntry temperature={temperature} start_time={start_time} end_time={end_time} days_of_the_week={days_of_the_week} active={active}/>
						<a href="javascript:void(0)" onClick={this.editEntry.bind(this,i)}>edit</a> &nbsp; 
						<a href="javascript:void(0)" onClick={this.removeEntry.bind(this,i)}>remove</a>
					</li>
				);
			}
		}
		return(
		 <div>
			<ul>{rows}</ul>
			<a href="javascript:void(0)" onClick={this.newEntry}>new entry</a>
		</div>
		);
	}
});




var ScheduleEntry = React.createClass({
  	render: function() {
		var temperature = this.props.temperature;
		var start_time = this.props.start_time;
		var end_time = this.props.end_time;
		var active = this.props.active?"active":"disabled";
		var mon = this.props.days_of_the_week.indexOf(0)>=0?"mon":"";
		var tue = this.props.days_of_the_week.indexOf(1)>=0?"tue":"";
		var wed = this.props.days_of_the_week.indexOf(2)>=0?"wed":"";
		var thu = this.props.days_of_the_week.indexOf(3)>=0?"thu":"";
		var fri = this.props.days_of_the_week.indexOf(4)>=0?"fri":"";
		var sat = this.props.days_of_the_week.indexOf(5)>=0?"sat":"";
		var sun = this.props.days_of_the_week.indexOf(6)>=0?"sun":"";
		return(
			<span>
				<span>{active}</span> -&nbsp;
				<span>{temperature}</span> <span>degrees</span> - &nbsp;
				<span>from </span> <span>{start_time}</span>&nbsp;
				<span>to </span> <span>{end_time}</span> -&nbsp;
				<span>on </span> <span>{mon} {tue} {wed} {thu} {fri} {sat} {sun} </span>
			</span>
		);
	}
});

var FileViewer = React.createClass({
	
	getInitialState: function() {
    	return {'refresh':true};
  	},

	load: function(){
		$.ajax({
      		url: this.props.url,
      		dataType: 'json',
      		success: function(data) {
				try {
				    this.setState(data);
				} catch(err) {
					console.error(this.props.url, status, err.message);
					flashError("error parsing data for "+this.props.url+" ! "+err.toString());
				}
      		}.bind(this),
      		error: function(xhr, status, err) {
        		console.error(this.props.url, status, err.toString());
				flashError("error loading "+this.props.url+" ! "+err.toString());
      		}.bind(this)
    	});
	},
  
	componentDidMount: function() {
		this.load();
  	},


	render: function() {
		if(!this.state.mode){
			return(
			<div>
				Loading...
			</div>
			);
		}
		var mode = this.state.mode?this.state.mode :'unknown';

		return (
			<pre>
				{content}
			</pre>
		 );
  	}
});