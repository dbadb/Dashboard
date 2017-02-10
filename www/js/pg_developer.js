//
// javascript page handler for about.html
//
(function(global) {
'use strict';
var developer = {
    iteration: 0,
    netTabIdToKey: {
        "launcherTGT": "/SmartDashboard/Launcher_TGT",
    },

    netTabActions: { // a dispatch table...
        // DriveTrain ------------------------------------------------------
        "/SmartDashboard/Drivetrain_Status": function(o, value) {
            $("#drivetrainStatus").text(value);
        },
        "/SmartDashboard/Drivetrain_IMU_Heading": function(o, value) {
            o.updateIMU(Number(value));
        },

        // Launcher + Agitator ---------------------------------------------
        "/SmartDashboard/Launcher Status:": function(o, value) {
            $("#launcherStatus").text(value);
        },
        "/SmartDashboard/Agitator Status:": function(o, value) {
            $("#agitatorStatus").text(value);
        },
        "/SmartDashboard/Launcher_TGT": function(o, value) {
            $("#launcherTGT").val(value);
            $("#launcherTGTTxt").text(value);
        },
        "/SmartDashboard/Launcher_ACT": function(o, value) {
            if(o.launcherACT) {
                o.launcherACT.addDataPt(Math.abs(value));
            }
        },
        "/SmartDashboard/Launcher_MSG": function(o, value) {
            $("#launcherMSG").text(value);
        },

        // Intake --------------------------------------------------------
        "/SmartDashboard/Intake Status:": function(o, value) {
            $("#intakeStatus").text(value);
        },
        "/SmartDashboard/Intake State:": function(o, value) {
            $("#intakeState").text(value);
        },
        "/SmartDashboard/Intake Speed": function(o, value) {
            $("#intakeSpeed").text(value);
        },

        // Climber --------------------------------------------------------
        "/SmartDashboard/Climber Status:": function(o, value) {
            $("#climberStatus").text(value);
        },
        "/SmartDashboard/Climber State:": function(o, value) {
            $("#climberState").text(value);
        },
        "/SmartDashboard/Climber Speed": function(o, value) {
            $("#climberSpeed").text(value);
        },
    },

    pageLoaded: function(targetElem, html) {
        // app.logMsg("devpgLoaded begin --------{");
        var self = this;
        targetElem.innerHTML = html;

        // Selector (pulldown menu) support ------------------------------
        //  (currently there are none on the dev page)
        // The asumption is that the id of the selector matches
        // the SmartDashboard key.
        $(".selector").each(function() {
            var key = $(this).attr("id");
            var ntkey = "/SmartDashboard/" + key;
            var val = NetworkTables.getValue(ntkey);
            $(this).val(val);
        });

        // now update network tables on changes
        $(".selector").change(function() {
            var value = $(this).val();
            var key = $(this).attr("id");
            var ntkey = "/SmartDashboard/" + key ;
            NetworkTables.putValue(ntkey, value);
        });

        // Slider support ----------------------------------------------
        $("input[type=range]").on('input', function() {
                var id = $(this).attr("id");
                var ntkey = self.netTabIdToKey[id];
                var value = $(this).val();
                $("#"+id+"Txt").text(value);
                // app.logMsg("slider " + id + ": " + value);
                NetworkTables.putValue(ntkey, Number(value));
            });


        // special widgets -----------------------------------------------
        if(true) {
            this.imuHeadingGage = new JustGage({
                id: "imuHeadingGage",
                value: 67,
                min: -180,
                max: 180,
                title: "IMU Heading",
                valueFontColor: "#888",
                startAnimationTime: 150,
                refreshAnimationTime: 0,
                gaugeColor: "#333",
                levelColors: ["#000150", "#0025a0", "#1040f0"]
            });
        }
        else {
            this.imuHeadingGage = null;
        }

        // console.log("chartWidth:" + $("#imuHeadingChart").width());
        // console.log("chartHeight:" + $("#imuHeadingChart").height());
        this.imuHeadingChart = new StripChart({
            id: "#imuHeadingChart",
            yaxis: {
                min:-200,
                max:200,
            }
        });
        //  Launcher -------------------------------------------------------
        this.launcherACT = new StripChart({
            id: "#launcherACT",
            yaxis: {
                min:1000,
                max:5000
            }
        });

        function updateWhenNoRobot() {
            var r = Math.random();
            var angle = Math.floor(180*(Math.sin(self.iteration/10) *
                                     Math.sin(self.iteration/7) +
                                     .2*r));
            self.iteration++;
            self.updateIMU(angle);

            var range = self.launcherACT.config.yaxis.max -
                        self.launcherACT.config.yaxis.min;
            var mid = self.launcherACT.config.yaxis.min + .5 * range;
            self.launcherACT.addDataPt(mid + .3 * range * (r - .5));
            if(!app.robotConnected)
            {
                setTimeout(updateWhenNoRobot, 100);
            }
        }
        if(!app.robotConnected)
        {
            updateWhenNoRobot();
        }
        // we assume that after page loaded, we'll receive a dump
        // of all networktable values (via onNetTabChange)
        //app.logMsg("devpgLoaded end --------}");
    },

    updateIMU: function(num) {
        if(this.imuHeadingGage) {
            this.imuHeadingGage.refresh(num);
        }
        if(this.imuHeadingChart) {
            $("#imuHeading").text(num);
            this.imuHeadingChart.addDataPt(num);
        }
    },

    onNetTabChange: function(key, value, isNew) {
        var f = this.netTabActions[key];
        if(f)
        {
            // app.logMsg("ntchange: " + key + ":" + value + " (" +isNew + ")");
            // app.logMsg("this.keys: " + Object.keys(this));
            f(this, value);
        }
        else {
            // app.logMsg("skipping ntchange for:" + key);
        }
    },

};
global.app.setPageHandler("developer", developer);
})(window);
