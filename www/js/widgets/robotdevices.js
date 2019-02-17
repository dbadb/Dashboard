/* global app, $, Widget */

class RobotDevicesWidget extends Widget
{
    constructor(config, targetElem, pageHandler)
    {
        super(config, targetElem);
        let w = this.config;
        let html = "<div class='containerrow'>";
        html +=     `<span class='title'>${this.config.label}</span>`;
        html +=   "</div>";
        html +=        "<table id='devicetable' border='0'>";
        html +=          "<tbody>";
        html +=         "</tbody>";
        html +=       "</table>";
        html += "<hr/>";
        targetElem.html(html);
        this.pageHandler = pageHandler;
        this.testData = [
            {
                "BootloaderRev": "0.2",
                "CurrentVers": "4.1",
                "DynID": 17102859,
                "HardwareRev": "1.0",
                "ID": 17103872,
                "ManDate": "Nov 19, 2017",
                "Model": "Victor SPX",
                "Name": "Victor 0 - Left",
                "SoftStatus": "Running Application",
                "UniqID": 5,
                "Vendor": "Vexing Robotics"
            },
            {
                "BootloaderRev": "2.6",
                "CurrentVers": "4.1",
                "DynID": 33880073,
                "HardwareRev": "1.4",
                "ID": 33881088,
                "ManDate": "Nov 3, 2014",
                "Model": "Talon SPX",
                "Name": "Victor 0 - Right",
                "SoftStatus": "Running Application",
                "UniqID": 4,
                "Vendor": "Over the Hill Electronics"
            },
            {
                "BootloaderRev": "2.6",
                "CurrentVers": "4.1",
                "DynID": 33880071,
                "HardwareRev": "1.4",
                "ID": 33881089,
                "ManDate": "Nov 3, 2014",
                "Model": "Talon SRX",
                "Name": "Talon 1 - Left",
                "SoftStatus": "Running Application",
                "UniqID": 6,
                "Vendor": "Over the Hill Electronics"
            }
        ];
        this.ctlsEnabled = false; // api doesn't appear to work

        this._buildDeviceList();
    }

    valueChanged(key, value, isNew)
    {
        this._buildDeviceList();
    }

    addRandomPt()
    {
        // no-op, managed explicitly by our pagehandler
    }

    _buildDeviceList()
    {
        this.devArray = app.getRobotDeviceArray();
        if(!this.devArray && false)
            this.devArray = this.testData;
        $("#devicetable tbody > tr").remove();

        // order of fields in Tuner:
        //  Devices, Software Status, Hardware, ID, Firmware Version,
        //  Manufacturer Date, Bootloader Rev, Hardware Version, Vendor
        // Data available: (via CTRE.Phoenix.Diagnostics/JSON/Serializers.cs)
        /*
           {
                public string BootloaderRev;
                public string CurrentVers;
                public int? DynID;
                public string HardwareRev;
                public string Vendor;
                public long? ID;
                public string ManDate;
                public string Model;
                public string Name;
                public string SoftStatus;
                public int? UniqID;
            }
        */
        let tr = $("<tr></tr>").appendTo($("#devicetable > tbody:last"));

        let cols = ["Model", "Device Name", "Firmware", 
                    "UniqID", "DynID", "ID", "Status", 
                    //"LED", "Self Test", (!this.ctlsEnabled)
                    "Manufacture Date",
                    "Bootloader", "Hardware", 
                ];
        for(let nm of cols)
        {
            $("<td></td>").html(`<span class='lessblue'>${nm}</span>`).appendTo(tr);
        }
        if(!this.devArray)
        {
            tr = $("<tr></tr>").appendTo($("#devicetable > tbody:last"));
            $("<td colspan='5'></td>").html(
                "<span class='amber'>no devices available...</span>").appendTo(tr);
        }
        else
        {
            let devId = 0;
            for(let dev of this.devArray)
            {
                tr = $("<tr></tr>").appendTo($("#devicetable > tbody:last"));

                // Model
                $("<td></td>").text(dev.Model).appendTo(tr);

                // DeviceName
                $("<td></td>").text(dev.Name).appendTo(tr);

                // Firmware Vers
                $("<td></td>").text(dev.CurrentVers).appendTo(tr);

                // UniqID
                $("<td></td>").text(dev.UniqID).appendTo(tr);

                // ID
                $("<td></td>").text("0x" + Number(dev.ID).toString(16)).appendTo(tr);

                // DynID
                $("<td></td>").text("0x" + Number(dev.DynID).toString(16)).appendTo(tr);

                // Status
                $("<td></td>").text(dev.SoftStatus).appendTo(tr);

                if(this.ctlsEnabled)
                {
                    // LED
                    $("<td></td>").html(
                        `<button type='button' id='blink_${devId}'` +
                        ` class='devbut'>blink</button>`).appendTo(tr);

                    // Self Test
                    $("<td></td>").html(
                        `<button type='button' id='selftest_${devId}'` +
                        ` class='devbut'>self-test</button>`).appendTo(tr);
                }

                // Manufacture Date
                $("<td></td>").text(dev.ManDate).appendTo(tr);

                // Bootloader Vers
                $("<td></td>").text(dev.BootloaderRev).appendTo(tr);

                // Hardware Vers
                $("<td></td>").text(dev.HardwareRev).appendTo(tr);

                devId++;
            }

            $(".devbut").click( this._onClick.bind(this));
        }
    }

    _onClick(evt)
    {
        // we can also change things via http
        // https://github.com/CrossTheRoadElec/Phoenix-diagnostics-client
        //
        // http://<address>:<port>/?device=<model>&id=<id>&action=<action>&<furtherArgs>
        //  model: [srx,spx,canif,pigeon,ribbonPigeon,pcm,pdp]
        //  action: [getversion,getdevices,blink,setid,selftest,fieldupgrade,progress,getconfig,setconfig]
        //      setid (newid=)
        //      setname (newname=)
        let fields = evt.target.id.split("_"); // expect length 2, [action, index]
        let action = fields[0];
        let devIndex = fields[1];
        let dev = this.devArray[devIndex];
        let model = {
                    "Talon SRX": "srx",
                    "PCM": "pcm",
                    "PDP": "pdp",
                    "Pigeon Over Ribbon": "ribbonPigeon",
                    "Pigeon": "pigeon",
                    "Talon SPX": "spx",
                    "Victor SPX": "spx",
                    "unknown": "canif"
                    }[dev.Model];
        if(model != undefined)
        {
            // let id = dev.UniqID;
            let id = dev.ID;
            let url = `/api/?device=${model}&id=${id}&action=${action}`;
            app.sendGetRequest(url, this._onClickResult.bind(this), true /*isJSON*/);
        }
        else
        {
            app.warning(`can't send message to ${dev.Name} ` +
                        `(unimplemented model ${dev.Model})`);
        }
        evt.target.blur();
    }

    _onClickResult(obj)
    {
        app.notice("result obtained: " + JSON.stringify(obj));
    }
}

Widget.AddWidgetClass("robotdevices", RobotDevicesWidget);