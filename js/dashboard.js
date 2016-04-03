Vue.config.debug = true;

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

Vue.transition('reload', {
	enterClass: "flipInX",
	leaveClass: "fadeOutLeft",
});

Vue.component('competitors', {
	props: ['list', 'showAthletes'],
	template: '#competitors-template',
});

Vue.component('athlete', {
	props: ['data'],
	template: '#athlete-template',
	computed: {
		athleteName: function() {
			return this.data.userFirstName.capitalize() + ' ' + this.data.userLastInitial + '.';
		},
		numReps: function() {
			if (this.data.style == '(SC)') {
				return this.data.reps + '*';
			} else {
				return this.data.reps;
			}
		}
	}
});

new Vue({
	el: '#leaderboard-app',

	data: {
		test: '',
		competitors: [],
		tests: [],
		showAthletes: true,
		numAthletes: 0,
		pageOfLeaderboard: 0,
		numTopAthletesSticky: 3,
		numPagesOfLeaderboard: 0,
		numAthletesPerPage: 10,
		leaderboardPageDelay: 10000,
		ajaxErrorCount: 0,
		reps: [],
		percentPrescribed: 0,
	},

	methods: {
		updateData: function() {
			this.competitors = [];
			this.showAthletes = false;
			this.$http.get('https://apis.trainheroic.com/public/leaderboard/468425', function (response, status, request) {

				this.test = response.tests[0].title;
                competitors = response.results;
                this.competitors = this.addRepsStats(competitors);
                this.numAthletes = response.results.length;
                this.numPagesOfLeaderboard = this.calcNumPages();
                this.pageOfLeaderboard = 0;

                this.showAthletes = true;
                this.ajaxErrorCount = 0;

                this.cycleLeaderboard();

            }).catch(function (data, status, request) {
            	if (this.ajaxErrorCount < 3) {
            		this.ajaxErrorCount += 1;
            		this.updateData();
            	} else {
            		return false;
            	}
            });
		},
		cycleLeaderboard: function() {
			if (this.pageOfLeaderboard < this.numPagesOfLeaderboard) {
				this.pageOfLeaderboard += 1
				setTimeout(this.cycleLeaderboard, this.leaderboardPageDelay)
			} else {
				this.updateData()
			}
		},
		addRepsStats: function(competitors) {
			reps = []
			rxCount = 0
			scCount = 0
			for (var key in competitors) {
				var testStats = competitors[key].tests[0].split(' ');
				competitors[key]['reps'] = testStats[0]
				competitors[key]['style'] = testStats[1]

				reps.push(testStats[0])
				if (testStats[1] == '(RX)') {
					rxCount += 1
				} else {
					scCount += 1
				}
			}
			this.reps = reps
			this.percentPrescribed = Math.round(rxCount / (rxCount + scCount) * 100)
			return competitors
		},
		calcNumPages: function() {
			var numPaginatedAthletes = (this.numAthletes - this.numTopAthletesSticky)
			var numAthletesPerPage = this.numAthletesPerPage
			if (numPaginatedAthletes % numAthletesPerPage) {
				return Math.floor(numPaginatedAthletes / numAthletesPerPage) + 1;
			} else {
				return Math.floor(numPaginatedAthletes / numAthletesPerPage);
			}
		}
	},

	computed: {
		leaderboardTitle: function() {
			if (this.ajaxErrorCount < 3) {
				return this.test + ' Leaderboard';
			} else {
				return "No data. Please reload."
			}
		},
		topX: function() {
			return this.competitors.slice(0,this.numTopAthletesSticky);
		},
		leaderboardPage: function() {
			var start = (this.pageOfLeaderboard - 1) * this.numAthletesPerPage + 5
			var end = start + this.numAthletesPerPage
			if (end > this.numAthletes) {
				end = this.numAthletes
			}
			return this.competitors.slice(start, end);
		},
		medianReps: function() {
			var middle = Math.floor(this.numAthletes / 2);
			return this.reps[middle]
		},
		maxReps: function() {
			return this.reps[0];
		}
	},

    ready: function() {
        this.updateData();
    },
});