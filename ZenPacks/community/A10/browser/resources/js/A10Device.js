/*
 * Based on the configuration in ../../configure.zcml this JavaScript will only
 * be loaded when the user is looking at A10Device in the web interface.
 */

(function(){

var ZC = Ext.ns('Zenoss.component');

/*
 * Custom component grid panel. This controls the grid that gets displayed for
 * components of the type set in "componentType".
 *
 * The name of the component panel MUST be the exact name of the object component
 *    catenated with Panel - hence A10ServerPanel
 *
 * Any columns that use a "dataIndex", that dataIndex name must appear in the fields stanza
 *    but order is NOT important. You must include uid in the fields stanza (but need not include in columns).
 *    If you do NOT include "monitor" in the fields stanza, then there will be no Graphs
 *        option in the DISPLAY dropdown.
 * It is the order of the stanzas under "columns" that defines the order on the web page
 *
 * Use the Zenoss-provided ping status renderer to display icons for serverEnabledState and ServerMonitorState where
 *      ServerEnabledState=1 = running = green,   otherwise red
 * and  ServerMonitorState=1 = Up = green,  0=disabled, 2=down = Down = red
 */

function render_link(ob) {
    if (ob && ob.uid) {
        return Zenoss.render.link(ob.uid);
    } else {
        return ob;
    }
}

Ext.apply(Zenoss.render, {
    A10Device_entityLinkFromGrid: function(obj, col, record) {
        if (!obj)
            return;

        if (typeof(obj) == 'string')
            obj = record.data;

        if (!obj.title && obj.name)
            obj.title = obj.name;

        var isLink = false;

        if (this.refName == 'componentgrid') {
            // Zenoss >= 4.2 / ExtJS4
            if (this.subComponentGridPanel || this.componentType != obj.meta_type)
                isLink = true;
        } else {
            // Zenoss < 4.2 / ExtJS3
            if (!this.panel || this.panel.subComponentGridPanel)
                isLink = true;
        }

        if (isLink) {
            return '<a href="javascript:Ext.getCmp(\'component_card\').componentgrid.jumpToEntity(\''+obj.uid+'\', \''+obj.meta_type+'\');">'+obj.title+'</a>';
        } else {
            return obj.title;
        }
    },

    checkbox: function(bool) {
        if (bool) {
            return '<input type="checkbox" checked="true" disabled="true">';
        } else {
            return '<input type="checkbox" disabled="true">';
        }
    }
});



ZC.A10ComponentGridPanel = Ext.extend(ZC.ComponentGridPanel, {
    subComponentGridPanel: false,

    jumpToEntity: function(uid, meta_type) {
        var tree = Ext.getCmp('deviceDetailNav').treepanel;
        var tree_selection_model = tree.getSelectionModel();
        var components_node = tree.getRootNode().findChildBy(
            function(n) {
                if (n.data) {
                    // Zenoss >= 4.2 / ExtJS4
                    return n.data.text == 'Components';
                }

                // Zenoss < 4.2 / ExtJS3
                return n.text == 'Components';
            });

        // Reset context of component card.
        var component_card = Ext.getCmp('component_card');

        if (components_node.data) {
            // Zenoss >= 4.2 / ExtJS4
            component_card.setContext(components_node.data.id, meta_type);
        } else {
            // Zenoss < 4.2 / ExtJS3
            component_card.setContext(components_node.id, meta_type);
        }

        // Select chosen row in component grid.
        component_card.selectByToken(uid);

        // Select chosen component type from tree.
        var component_type_node = components_node.findChildBy(
            function(n) {
                if (n.data) {
                    // Zenoss >= 4.2 / ExtJS4
                    return n.data.id == meta_type;
                }

                // Zenoss < 4.2 / ExtJS3
                return n.id == meta_type;
            });

        if (component_type_node.select) {
            tree_selection_model.suspendEvents();
            component_type_node.select();
            tree_selection_model.resumeEvents();
        } else {
            tree_selection_model.select([component_type_node], false, true);
        }
    }
});


/*
 * Custom component grid panel. This controls the grid that gets displayed for
 * components of the type set in "componenType".
 */
ZC.A10ServerPanel = Ext.extend(ZC.A10ComponentGridPanel, {
    constructor: function(config) {
        config = Ext.applyIf(config||{}, {
            componentType: 'A10Server',
            sortInfo: {
                field: 'name',
                direction: 'ASC'
            },

            /*
	    filter: function(serverList) {
                for (i=0; i<serverList.length; i++) {
                    if (this.componentName == serverList[i]) {
		        this.refresh();
                    }
                }
	    },
            */
            fields: [
                {name: 'uid'},
                {name: 'name'},
                {name: 'severity'},
                {name: 'ServerName'},
                {name: 'ServerAddress'},
                {name: 'ServerHealthMonitor'},
                {name: 'ServerEnabledState'},
                {name: 'ServerMonitorState'},
                {name: 'monitor'},
                {name: 'monitored'},
                {name: 'usesMonitorAttribute'},
                {name: 'locking'}
            ],
            columns: [{
                id: 'severity',
                dataIndex: 'severity',
                header: _t('Events'),
                renderer: Zenoss.render.severity,
                sortable: true,
                width: 50
            },{
                id: 'ServerName',
                dataIndex: 'ServerName',
                header: _t('Name'),
                sortable: true,
                width: 200
            },{
                id: 'ServerAddress',
                dataIndex: 'ServerAddress',
                header: _t('Address'),
                sortable: true,
                width: 100
            },{
                id: 'ServerHealthMonitor',
                dataIndex: 'ServerHealthMonitor',
                header: _t('Health Monitor'),
                sortable: true,
                width: 100
            },{
                id: 'ServerEnabledState',
                dataIndex: 'ServerEnabledState',
                header: _t('Enabled'),
                sortable: true,
                renderer: function(dS) {
                        if (dS==1) {
                          return Zenoss.render.pingStatus('up');
                        } else {
                          return Zenoss.render.pingStatus('down');
                        }
                },
                width: 60
            },{
                id: 'ServerMonitorState',
                dataIndex: 'ServerMonitorState',
                header: _t('Server Monitored'),
                sortable: true,
                renderer: function(dS) {
                        if (dS==1) {
                          return Zenoss.render.pingStatus('up');
                        } else {
                          return Zenoss.render.pingStatus('down');
                        }
                },
                width: 100
            },{
                id: 'monitored',
                dataIndex: 'monitored',
                header: _t('Monitored'),
                renderer: Zenoss.render.checkbox,
                sortable: true,
                width: 65
            },{
                id: 'locking',
                dataIndex: 'locking',
                header: _t('Locking'),
                renderer: Zenoss.render.locking_icons
            }]
        });
        ZC.A10ServerPanel.superclass.constructor.call(this, config);
    }
});
Ext.reg('A10ServerPanel', ZC.A10ServerPanel);

/*
 * Friendly names for the components. First parameter is the meta_type in your
 * custom component class. Second parameter is the singular form of the
 * friendly name to be displayed in the UI. Third parameter is the plural form.
 */
ZC.registerName('A10Server', _t('Server'), _t('Servers'));

ZC.A10VirtualServerPanel = Ext.extend(ZC.A10ComponentGridPanel, {
    constructor: function(config) {
        config = Ext.applyIf(config||{}, {
            componentType: 'A10VirtualServer',
            sortInfo: {
                field: 'name',
                direction: 'ASC'
            },
            fields: [
                {name: 'uid'},
                {name: 'id'},
                {name: 'name'},
                {name: 'severity'},
                {name: 'VirtualServerName'},
                {name: 'VirtualServerAddress'},
                {name: 'VirtualServerEnabled'},
                {name: 'VirtualServerDisplayStatus'},
                {name: 'VirtualServerDisplayStatusString'},
                {name: 'VirtualServerPortNum'},
                {name: 'VirtualServerPortType'},
                {name: 'VirtualServerPortTypeString'},
                {name: 'VirtualServerPortEnabled'},
                {name: 'VirtualServerPortEnabledString'},
                {name: 'VirtualServerPortServiceGroup'},
                {name: 'VirtualServerServiceGroupList'},
                {name: 'VirtualServerServiceGroupObjectList'},
                {name: 'monitor'},
                {name: 'monitored'},
                {name: 'usesMonitorAttribute'},
                {name: 'locking'}
            ],
            columns: [{
                id: 'severity',
                dataIndex: 'severity',
                header: _t('Events'),
                renderer: Zenoss.render.severity,
                sortable: true,
                width: 50
            /*
            },{
                id: 'id',
                dataIndex: 'id',
                header: _t('Server Id'),
                renderer: Zenoss.render.A10Device_entityLinkFromGrid,
                panel: this,
                sortable: true,
                width: 200
            */
            },{
                id: 'VirtualServerName',
                dataIndex: 'VirtualServerName',
                header: _t('Virtual Server Name'),
                sortable: true,
                width: 200
            },{
                id: 'VirtualServerAddress',
                dataIndex: 'VirtualServerAddress',
                header: _t('Address'),
                sortable: true,
                width: 100
            },{
                id: 'VirtualServerEnabled',
                dataIndex: 'VirtualServerEnabled',
                header: _t('Enabled'),
                sortable: true,
                renderer: function(dS) {
                        if (dS==1) {
                          return Zenoss.render.pingStatus('up');
                        } else {
                          return Zenoss.render.pingStatus('down');
                        }
                },
                width: 60
            },{
                id: 'VirtualServerDisplayStatusString',
                dataIndex: 'VirtualServerDisplayStatusString',
                header: _t('Server Status'),
                sortable: true,
                width: 100
            /*
            },{
                id: 'VirtualServerPortNum',
                dataIndex: 'VirtualServerPortNum',
                header: _t('Port Num.'),
                sortable: true,
                width: 55
            },{
                id: 'VirtualServerPortTypeString',
                dataIndex: 'VirtualServerPortTypeString',
                header: _t('Port Type'),
                sortable: true,
                width: 70
            },{
                id: 'VirtualServerPortEnabled',
                dataIndex: 'VirtualServerPortEnabled',
                header: _t('Port Enabled'),
                sortable: true,
                renderer: function(dS) {
                        if (dS==1) {
                          return Zenoss.render.pingStatus('up');
                        } else {
                          return Zenoss.render.pingStatus('down');
                        }
                },
                width: 60
            },{
                id: 'VirtualServerPortServiceGroup',
                dataIndex: 'VirtualServerPortServiceGroup',
                header: _t('Service Group'),
                sortable: true,
                width: 200
            },{
                id: 'VirtualServerServiceGroupList',
                dataIndex: 'VirtualServerServiceGroupList',
                header: _t('Service Group List'),
                renderer: function(vssgs) {
                    var returnString = '';
                    Ext.each(vssgs, function(vssg, index) {
                        if (index > 0) returnString += ', ';
                        if (vssg && Ext.isObject(vssg)) {
                            returnString += Zenoss.render.link(vssg.uid, undefined, name);

                        }
                        else if (Ext.isString(vssg)) {
                            returnString += vssg;
                        }
                    });
                    return returnString;
                },
                sortable: true,
                width: 200
            */
            },{
                id: 'VirtualServerServiceGroupObjectList',
                dataIndex: 'VirtualServerServiceGroupObjectList',
                header: _t('Service Group Object List'),
                renderer: function(vssgos) {
                    var returnString = '';
                    Ext.each(vssgos, function(vssgo, index) {
                        if (index > 0) returnString += ',';
                        if (vssgo && Ext.isObject(vssgo)) {
                            /*returnString += Zenoss.render.link(vssgo.uid, undefined, name);*/
                            returnString += Zenoss.render.A10Device_entityLinkFromGrid(vssgo);
                        }
                        else if (Ext.isString(vssgo)) {
                            returnString += vssgo;
                        }
                    });
                    return returnString;
                },
                sortable: true,
                width: 450
            },{
                id: 'monitored',
                dataIndex: 'monitored',
                header: _t('Monitored'),
                renderer: Zenoss.render.checkbox,
                sortable: true,
                width: 65
            },{
                id: 'locking',
                dataIndex: 'locking',
                header: _t('Locking'),
                renderer: Zenoss.render.locking_icons
            }]
        });
        ZC.A10VirtualServerPanel.superclass.constructor.call(this, config);
    }
});
Ext.reg('A10VirtualServerPanel', ZC.A10VirtualServerPanel);

/*
 * Friendly names for the components. First parameter is the meta_type in your
 * custom component class. Second parameter is the singular form of the
 * friendly name to be displayed in the UI. Third parameter is the plural form.
 */
ZC.registerName('A10VirtualServer', _t('Virtual Server'), _t('Virtual Servers'));

ZC.A10ServiceGroupPanel = Ext.extend(ZC.A10ComponentGridPanel, {
    constructor: function(config) {
        config = Ext.applyIf(config||{}, {
            componentType: 'A10ServiceGroup',
            sortInfo: {
                field: 'name',
                direction: 'ASC'
            },
            /*
	    filter: function(serverList) {
                for (i=0; i<serverList.length; i++) {
                    if (this.componentName == serverList[i]) {
		        this.refresh();
                    }
                }
	    },
            */
            fields: [
                {name: 'uid'},
                {name: 'name'},
                {name: 'severity'},
                {name: 'ServiceGroupName'},
                {name: 'ServiceGroupType'},
                {name: 'ServiceGroupTypeString'},
                {name: 'ServiceGroupDisplayStatus'},
                {name: 'ServiceGroupDisplayStatusString'},
                {name: 'ServiceGroupServerObjectList'},
                {name: 'ServiceGroupServerList'},
                {name: 'ServiceGroupPort'},
                {name: 'ServiceGroupServer'},
                {name: 'monitor'},
                {name: 'monitored'},
                {name: 'usesMonitorAttribute'},
                {name: 'locking'}
            ],
            columns: [{
                id: 'severity',
                dataIndex: 'severity',
                header: _t('Events'),
                renderer: Zenoss.render.severity,
                sortable: true,
                width: 50
            },{
                id: 'ServiceGroupName',
                dataIndex: 'ServiceGroupName',
                header: _t('Service Group Name'),
                sortable: true,
                width: 200
            },{
                id: 'ServiceGroupTypeString',
                dataIndex: 'ServiceGroupTypeString',
                header: _t('Type'),
                sortable: true,
                width: 50
            },{
                id: 'ServiceGroupDisplayStatusString',
                dataIndex: 'ServiceGroupDisplayStatusString',
                header: _t('Service Group Status'),
                sortable: true,
                width: 120
            /*
            },{
                id: 'ServiceGroupServer',
                dataIndex: 'ServiceGroupServer',
                header: _t('Service Group Server'),
                sortable: true,
                width: 200
            },{
                id: 'ServiceGroupPort',
                dataIndex: 'ServiceGroupPort',
                header: _t('Port'),
                sortable: true,
                width: 50
            },{
                id: 'ServiceGroupServerList',
                dataIndex: 'ServiceGroupServerList',
                header: _t('Server List'),
                sortable: true,
                width: 200
            */
            },{
                id: 'ServiceGroupServerObjectList',
                dataIndex: 'ServiceGroupServerObjectList',
                header: _t('Server Object List'),
                renderer: function(sgsos) {
                    var returnString = '';
                    Ext.each(sgsos, function(sgso, index) {
                        if (index > 0) returnString += ',';
                        if (sgso && Ext.isObject(sgso)) {
                            /*returnString += Zenoss.render.link(sgso.uid, undefined, name);*/
                            returnString += Zenoss.render.A10Device_entityLinkFromGrid(sgso);

                        }
                        else if (Ext.isString(sgso)) {
                            returnString += sgso;
                        }
                    });
                    return returnString;
                },
                sortable: true,
                width: 550
            },{
                id: 'monitored',
                dataIndex: 'monitored',
                header: _t('Monitored'),
                renderer: Zenoss.render.checkbox,
                sortable: true,
                width: 65
            },{
                id: 'locking',
                dataIndex: 'locking',
                header: _t('Locking'),
                renderer: Zenoss.render.locking_icons
            }]
        });
        ZC.A10ServiceGroupPanel.superclass.constructor.call(this, config);
    }
});
Ext.reg('A10ServiceGroupPanel', ZC.A10ServiceGroupPanel);

/*
 * Friendly names for the components. First parameter is the meta_type in your
 * custom component class. Second parameter is the singular form of the
 * friendly name to be displayed in the UI. Third parameter is the plural form.
 */
ZC.registerName('A10ServiceGroup', _t('Service Group'), _t('Service Groups'));


Zenoss.nav.appendTo('Component', [{
    id: 'component_a10ServiceGroup',
    text: _t('Service Groups'),
    xtype: 'A10ServiceGroupPanel',
    subComponentGridPanel: true,
    filterNav: function(navpanel) {
        if (navpanel.refOwner.componentType == 'A10VirtualServer') {
            return true;
        } else {
            return false;
        }
    },
    setContext: function(uid) {
        uid = uid.replace(/a10VirtualServers\/(.)*$/, '');
        var serviceGroups = ['sg_ext', 'sg_int'];
        /*ZC.A10ServerPanel.superclass.filter.apply(this, serviceGroups);*/
        ZC.A10ServiceGroupPanel.superclass.setContext.apply(this, [uid]);
    }
}]);

Zenoss.nav.appendTo('Component', [{
    id: 'component_a10Server',
    text: _t('Servers'),
    xtype: 'A10ServerPanel',
    subComponentGridPanel: true,
    filterNav: function(navpanel) {
        switch (navpanel.refOwner.componentType){
            case 'A10ServiceGroup': return true
            default: return false;
        }
    },
    setContext: function(uid) {
        /*uid = '/zport/dmd/Devices/Network/A10/devices/sc01axlb-1.tiprod.net/a10Servers';*/
        uid = uid.replace(/a10ServiceGroups\/(.)*$/, '');
        /*uid = uid += '/a10SgServers';*/
        /*uid = '/zport/dmd/Devices/Network/A10/devices/sc01axlb-1.tiprod.net/a10ServiceGroups/Analytics_80/a10SgServers';*/
        /*var servers = ['sc01shareweb', 'sc01searchweb'];*/
        /*var servers = ['graph4twem']*/
        var servers = []
        if (Ext.isObject(uid)) {
            /*servers = uid.ServiceGroupServerList;*/
            servers = ['sc01searchweb'];
        }
        /*ZC.A10ServerPanel.superclass.filter.apply(this, servers);*/
        ZC.A10ServerPanel.superclass.setContext.apply(this, [uid]);
    }
}]);


})();
