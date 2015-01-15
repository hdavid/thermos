
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
					$('#notice').html("error parsing data for "+this.props.name+" ! "+err.toString()).show().fadeOut(2000);
				}
      		}.bind(this),
      		error: function(xhr, status, err) {
        		console.error(this.props.url, status, err.toString());
				$('#notice').html("error loading "+this.props.name+" ! "+err.toString()).show().fadeOut(2000);
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
				$('#notice').html(this.props.name+" saved !").show().fadeOut(2000);
    		}.bind(this),
    		error: function(xhr, status, err) {
      			console.error(this.props.url, status, err.toString());
				$('#notice').html("error saving "+this.props.name+" ! "+err.toString()).show().fadeOut(2000);
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
				<h2>Config</h2>
				Loading...
			</div>
			);
		}
		if(this.mustSave){
			this.save();
			this.mustSave=false;
		}
		var schedule_checked = this.state.mode=="schedule" ? true : false;
		var on_checked = this.state.mode=="manual" ? true : false;
		var off_checked = this.state.mode=="off" ? true : false;
		var manual_temperature = this.state.manual_temperature;
		//alert(JSON.stringify(this.state));
		return (
			<div>
			<h2>Config</h2>
		     <div>
					<input type="radio" name='mode' value="schedule" id="mode_schedule" defaultChecked={schedule_checked} onChange={this.handleChange} />
					<label htmlFor="mode_schedule">schedule</label>&nbsp;
					<input type="radio" name='mode' value="manual" id="mode_manual" defaultChecked={on_checked} onChange={this.handleChange}/>
					<label htmlFor="mode_manual">manual</label>&nbsp;
					<input type="radio" name='mode' value="off" id="mode_off" defaultChecked={off_checked} onChange={this.handleChange}/>
					<label htmlFor="mode_off">off</label>&nbsp;
					<br/>
					<label htmlFor='manual_temperature'>manual temperature</label>&nbsp;
					<input id="manual_temperature" name="manual_temperature" type="text" size="4" defaultValue={manual_temperature} onChange={this.handleChange}/>
			</div>
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
					//if(this.state.refresh){
					setTimeout(this.load, 2000);
					//}
				    this.setState(data);
				} catch(err) {
					console.error(this.props.url, status, err.message);
					$('#notice').html("error parsing data for "+this.props.name+" ! "+err.toString()).show().fadeOut(2000);
				}
      		}.bind(this),
      		error: function(xhr, status, err) {
        		console.error(this.props.url, status, err.toString());
				$('#notice').html("error loading "+this.props.name+" ! "+err.toString()).show().fadeOut(2000);
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
				<h2>Status</h2>
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
				<h2>Status</h2>
				<ul>
					<li>current temperature:{current_temperature}</li>
					<li>heating: {heating}</li>
					<li>mode: {mode}</li>
					<li>scheduled temperature:{scheduled_temperature}</li>
					<li>current schedule: {active_schedule_entry?
						<ScheduleEntry 
							temperature={active_schedule_entry.temperature} 
							active={active_schedule_entry.active} 
							start_time={active_schedule_entry.start_time} 
							end_time={active_schedule_entry.end_time} 
							days_of_the_week={active_schedule_entry.days_of_the_week}
						/>
						:<div>None</div>
					}</li>
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
		var mon = this.state.days_of_the_week.indexOf(0)>=0?"mon":"";
		var tue = this.state.days_of_the_week.indexOf(1)>=0?"tue":"";
		var wed = this.state.days_of_the_week.indexOf(2)>=0?"wed":"";
		var thu = this.state.days_of_the_week.indexOf(3)>=0?"thu":"";
		var fri = this.state.days_of_the_week.indexOf(4)>=0?"fri":"";
		var sat = this.state.days_of_the_week.indexOf(5)>=0?"sat":"";
		var sun = this.state.days_of_the_week.indexOf(6)>=0?"sun":"";
		return(
		<div>	
			<fieldset>
				<label htmlFor='active'>active</label>&nbsp;
				<input type="checkbox" name="active" id="active" defaultChecked={active} key={"active"+active} onChange={this.handleChange} />
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
				<label htmlFor='weekdayMon'>mon</label>
				<input type="checkbox" name="weekdayMon" id="weekdayMon" defaultChecked={mon} key={"mon"+mon} onChange={this.toggleDay.bind(this,0)} />
				<label htmlFor='weekdayTue'>tue</label>
				<input type="checkbox" name="weekdayTue" id="weekdayTue" defaultChecked={tue} key={"tue"+tue} onChange={this.toggleDay.bind(this,1)} />
				<label htmlFor='weekdayWed'>wed</label>
				<input type="checkbox" name="weekdayWed" id="weekdayWed" defaultChecked={wed} key={"wed"+wed} onChange={this.toggleDay.bind(this,2)} />
				<label htmlFor='weekdayThu'>thu</label>
				<input type="checkbox" name="weekdayThu" id="weekdayThu" defaultChecked={thu} key={"thu"+thu} onChange={this.toggleDay.bind(this,3)} />
				<label htmlFor='weekdayFri'>fri</label>
				<input type="checkbox" name="weekdayFri" id="weekdayFri" defaultChecked={fri} key={"fri"+fri} onChange={this.toggleDay.bind(this,4)} />
				<label htmlFor='weekdaySat'>sat</label>
				<input type="checkbox" name="weekdaySat" id="weekdaySat" defaultChecked={sat} key={"sat"+sat} onChange={this.toggleDay.bind(this,5)} />
				<label htmlFor='weekdaySun'>sun</label>
				<input type="checkbox" name="weekdaySun" id="weekdaySun" defaultChecked={sun} key={"sun"+sun} onChange={this.toggleDay.bind(this,6)} />
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
			<h2>Schedule</h2>
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