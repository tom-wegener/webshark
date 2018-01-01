/* webshark-tap.js
 *
 * Copyright (C) 2016 Jakub Zawadzki
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 */

var m_webshark_rtp_player_module = require("./webshark-rtp-player.js");
var m_webshark_hexdump_module = require('./webshark-hexdump.js');

var m_prev_tap_selected_on_click = null;

function dom_create_label_span(str)
{
	var label = document.createElement("span");

	label.appendChild(document.createTextNode(str));

	return label;
}

function prec_trunc(x, num)
{
	var xnum = x * num;
	return Math.round(xnum) / x;
}

function webshark_tap_row_on_click(ev)
{
	var node;
	var action = null;

	node = window.webshark.dom_find_node_attr(ev.target, 'data_wlan_details');
	if (node != null)
		action = 'data_wlan_details';

	if (action == null)
	{
		node = window.webshark.dom_find_node_attr(ev.target, 'data_ws_analyse');
		if (node != null)
			action = 'data_ws_analyse';
	}

	if (action == null)
	{
		node = window.webshark.dom_find_node_attr(ev.target, 'data_ws_filter');
		if (node != null)
			action = 'data_ws_filter';
	}

	if (action == null)
	{
		var node_rtp = window.webshark.dom_find_node_attr(ev.target, 'data_ws_rtp_name');
		node = window.webshark.dom_find_node_attr(ev.target, 'data_ws_rtp_pos');

		if (node && node_rtp)
		{
			var rtp_str = node_rtp['data_ws_rtp_name'];

			var wave = m_webshark_rtp_player_module.get_from_name(rtp_str);
			if (wave)
			{
				var pos = node['data_ws_rtp_pos'] / wave.getDuration();
				wave.seekAndCenter(pos);
			}

			/* wavesurfer seek callback will take care about highlighting */
			return;
		}
	}

	if (node != null)
	{
		if (m_prev_tap_selected_on_click)
			m_prev_tap_selected_on_click.classList.remove("selected");

		node.classList.add("selected");
		m_prev_tap_selected_on_click = node;

		if (action == 'data_wlan_details')
		{
			var details = node['data_wlan_details'][0];
			var item    = node['data_wlan_details'][1];

			var tap_table = document.getElementById('ws_tap_table');
			var tap_extra = document.getElementById('ws_tap_details');

			tap_extra.style.display = 'block';
			tap_extra.innerHTML = "";

			/* XXX< hacky, add parameters to webshark_render_tap() */
			tap_table.id = '';
			tap_extra.id = 'ws_tap_table';

			data =
				{
					type: 'fake-wlan-details',
					items: details,
					orig_item: item
				};
			webshark_render_tap(data);

			tap_table.id = 'ws_tap_table';
			tap_extra.id = 'ws_tap_details';
		}

		if (action == 'data_ws_analyse')
		{
			var anal = node['data_ws_analyse'];

			var tap_req =
				{
					req: 'tap',
					capture: g_webshark_file,
					tap0: anal
				};

			window.webshark.webshark_json_get(tap_req,
				function(data)
				{
					var tap_table = document.getElementById('ws_tap_table');
					var tap_extra = document.getElementById('ws_tap_details');

					tap_extra.style.display = 'block';
					tap_extra.innerHTML = "";

					/* XXX< hacky, add parameters to webshark_render_tap() */
					tap_table.id = '';
					tap_extra.id = 'ws_tap_table';

					for (var i = 0; i < data['taps'].length - 1; i++)
						webshark_render_tap(data['taps'][i]);

					tap_table.id = 'ws_tap_table';
					tap_extra.id = 'ws_tap_details';
				});
		}

		if (action == 'data_ws_filter')
		{
			var filter = node['data_ws_filter'];
			document.getElementById('ws_packet_list_view').style.display = 'block';

			g_webshark.setFilter(filter);
		}
	}
}

var m_webshark_stat_fields =
{
	'name': 'Topic / Item',
	'count': 'Count',
	'avg': 'Average',
	'min': 'Min val',
	'max': 'Max val',
	'rate': 'Rate (ms)',
	'perc': 'Percent',
	'burstcount': 'Burst count',
	'burstrate': 'Burst rate',
	'bursttime': 'Burst start'
};

var m_webshark_conv_fields =
{
	'saddr': 'Address A',
	'sport': 'Port A',
	'daddr': 'Address B',
	'dport': 'Port B',
	'_packets': 'Packets',
	'_bytes': 'Bytes',
	'txf': 'Packets A -> B',
	'txb': 'Bytes A -> B',
	'rxf': 'Packets A <- B',
	'rxb': 'Bytes A <- B',
	'start': 'Rel start',
	'_duration': 'Duration',
	'_rate_tx': 'bps A->B',
	'_rate_rx': 'bps A<-B'
};

var m_webshark_host_fields =
{
	'host': 'Address',
	'port': 'Port',
	'_packets' : 'Packets',
	'_bytes': 'Bytes',
	'txf': 'TX Packets',
	'txb': 'TX Bytes',
	'rxf': 'RX Packets',
	'rxb': 'RX Bytes'
};

var m_webshark_host_fields_geo =
{
	'host': 'Address',
	'port': 'Port',
	'_packets' : 'Packets',
	'_bytes': 'Bytes',
	'txf': 'TX Packets',
	'txb': 'TX Bytes',
	'rxf': 'RX Packets',
	'rxb': 'RX Bytes',
	'geoip_country': 'GeoIP Country',
	'geoip_city': 'GeoIP City',
	'geoip_org': 'GeoIP ORG',
	'geoip_isp': 'GeoIP ISP',
	'geoip_as': 'GeoIP AS',
	'geoip_lat': 'GeoIP Lat',
	'geoip_lon': 'GeoIP Lon'
};

var m_webshark_eo_fields =
{
	'pkt': 'Packet number',
	'hostname': 'Hostname',
	'type': 'Content Type',
	'filename': 'Filename',
	'len': 'Length'
};

var m_webshark_rtp_streams_fields =
{
	'saddr': 'Src addr',
	'sport': 'Src port',
	'daddr': 'Dst addr',
	'dport': 'Dst port',
	'_ssrc': 'SSRC',
	'payload': 'Payload',
	'pkts':    'Packets',
	'_lost': 'Lost',
	'max_delta': 'Max Delta (ms)',
	'max_jitter': 'Max Jitter (ms)',
	'mean_jitter': 'Mean Jitter (ms)',
	'_pb': 'Pb?'
};

var m_webshark_rtp_analyse_fields =
{
	'_frame_time': 'Packet (Time)',
	'sn': 'Sequence',
	'd': 'Delta (ms)',
	'j': 'Filtered jitter (ms)',
	'sk': 'Skew (ms)',
	'bw': 'IP BW (kbps)',
	'_marker_str': 'Marker',
	'_status': 'Status'
};

var m_webshark_rtd_fields =
{
	'type':    'Type',
	'num':     'Messages',
	'_min':    'Min SRT [ms]',
	'_max':    'Max SRT [ms]',
	'_avg':    'AVG SRT [ms]',
	'min_frame': 'Min in Frame',
	'max_frame': 'Max in Frame',

/* optional */
	'open_req': 'Open Requests',
	'disc_rsp': 'Discarded Responses',
	'req_dup':  'Duplicated Requests',
	'rsp_dup':  'Duplicated Responses'
};

var m_webshark_srt_fields =
{
	'n':       'Procedure',
	'num':     'Calls',
	'_min':     'Min SRT [ms]',
	'_max':     'Max SRT [ms]',
	'_avg':    'Avg SRT [ms]'
};

var m_webshark_voip_calls_fields =
{
	'start':   'Start Time',
	'stop':    'Stop Time',
	'initial': 'Initial Speaker',
	'from':    'From',
	'to':      'To',
	'proto':   'Protocol',
	'pkts':    'Packets',
	'state':   'State',
	'comment': 'Comments'
};

var m_webshark_expert_fields =
{
	'f': 'No',
	's': 'Severity',
	'g': 'Group',
	'p': 'Protocol',
	'm': 'Summary'
};

var m_webshark_wlan_fields =
{
	'_bssid': "BSSID",
	'chan':  "Ch.",
	'ssid':  "SSID",
	'_perc':  "% Packets",
	't_beacon': "Beacons",
	't_data':    "Data Packets",
	't_probe_req': "Probe Req",
	't_probe_resp': "Probe Resp",
	't_auth': "Auth",
	't_deauth': "Deauth",
	't_other': "Other",
	'protection': "Protection"
};

var m_webshark_wlan_details_fields =
{
	'araw': 'Address',
	'_perc': '% Packets',
	't_data_sent': 'Data Sent',
	't_data_recv': 'Data Received',
	't_probe_req': 'Probe Req',
	't_probe_rsp': 'Probe Resp',
	't_auth': 'Auth',
	't_deauth': 'Deauth',
	't_other': 'Other',
	'_comment': 'Comment'
};

function webshark_create_tap_table_data_common(fields, table, data)
{
	for (var i = 0; i < data.length; i++)
	{
		var val = data[i];

		var tr = document.createElement('tr');

		tr.appendChild(webshark_create_tap_action_common(val));

		for (var col in fields)
		{
			var value = val[col];

			/* TODO, hide fields which are undefined for whole table */
			if (value == undefined)
				value = '-';

			var td = document.createElement('td');
			td.appendChild(document.createTextNode(value));
			td.className = "ws_border";
			tr.appendChild(td);
		}

		if (val['_css_class'])
		{
			tr.className = val['_css_class'];
		}

		if (val['_wlan_extra_data'] != undefined)
		{
			tr.data_wlan_details = val['_wlan_extra_data'];
			tr.addEventListener("click", webshark_tap_row_on_click);
		}
		else if (val['_rtp_goto'] != undefined)
		{
			tr.data_ws_rtp_pos = val['_rtp_goto'];
			tr.addEventListener("click", webshark_tap_row_on_click);
		}
		else if (val['_analyse'])
		{
			tr.data_ws_analyse = val['_analyse'];
			tr.addEventListener("click", webshark_tap_row_on_click);
		}
		else if (val['_filter'])
		{
			tr.data_ws_filter = val['_filter'];
			tr.addEventListener("click", webshark_tap_row_on_click);
		}

		table.appendChild(tr);
	}
}

function webshark_create_tap_action_common(data)
{
	var td = document.createElement('td');

	if (data['_analyse'])
	{
		var anal_a = document.createElement('a');

		anal_a.setAttribute("target", "_blank");
		anal_a.setAttribute("href", window.webshark.webshark_get_url() + "&tap=" + encodeURIComponent(data['_analyse']));
		anal_a.addEventListener("click", window.webshark.popup_on_click_a);

		var glyph = window.webshark.webshark_glyph_img('analyse', 16);
		glyph.setAttribute('alt', 'Details: ' + data['_analyse']);
		glyph.setAttribute('title', 'Details: ' + data['_analyse']);

		anal_a.appendChild(glyph);
		td.appendChild(anal_a);
	}

	if (data['_filter'])
	{
		var filter_a = document.createElement('a');

		filter_a.setAttribute("target", "_blank");
		filter_a.setAttribute("href", window.webshark.webshark_get_url() + "&filter=" + encodeURIComponent(data['_filter']));
		filter_a.addEventListener("click", window.webshark.popup_on_click_a);

		var glyph = window.webshark.webshark_glyph_img('filter', 16);
		glyph.setAttribute('alt', 'Filter: ' + data['_filter']);
		glyph.setAttribute('title', 'Filter: ' + data['_filter']);

		filter_a.appendChild(glyph);
		td.appendChild(filter_a);
	}

	if (data['_goto_frame'])
	{
		var show_a = document.createElement('a');

		show_a.setAttribute("target", "_blank");
		show_a.setAttribute("href", window.webshark.webshark_get_url() + "&frame=" + data['_goto_frame']);
		show_a.addEventListener("click", window.webshark.popup_on_click_a);

		var glyph = window.webshark.webshark_glyph_img('analyse', 16);
		glyph.setAttribute('alt', 'Load frame: ' + data['_filter']);
		glyph.setAttribute('title', 'Load frame: ' + data['_filter']);

		show_a.appendChild(glyph);
		td.appendChild(show_a);
	}

	if (data['_download'])
	{
		var down_a = document.createElement('a');

		down_a.setAttribute("target", "_blank");
		down_a.setAttribute("href", g_webshark_url + 'req=download&capture=' + g_webshark_file  + "&token=" + encodeURIComponent(data['_download']));
		down_a.addEventListener("click", window.webshark.popup_on_click_a);

		var glyph = window.webshark.webshark_glyph_img('download', 16);
		glyph.setAttribute('alt', 'Download: ' + data['_download']);
		glyph.setAttribute('title', 'Download: ' + data['_download']);

		down_a.appendChild(glyph);
		td.appendChild(down_a);
	}

	if (data['_play'])
	{
		var down_a = document.createElement('a');

		var descr = data['_play_descr'];
		if (!descr)
			descr = data['_play'];

		down_a.setAttribute("target", "_blank");
		down_a["ws_title"] = descr;
		down_a["ws_rtp"] = data['_play'];
		down_a.setAttribute("href", g_webshark_url + 'req=download&capture=' + g_webshark_file  + "&token=" + encodeURIComponent(data['_play']));
		down_a.addEventListener("click", m_webshark_rtp_player_module.play_on_click_a);

		var glyph = window.webshark.webshark_glyph_img('play', 16);
		glyph.setAttribute('alt', 'Load and play RTP: ' + descr);
		glyph.setAttribute('title', 'Load and play RTP: ' + descr);

		down_a.appendChild(glyph);
		td.appendChild(down_a);
	}

	td.className = "ws_border";

	return td;
}

function webshark_create_tap_table_common(fields)
{
	var table = document.createElement('table');
	var tr;

	tr = document.createElement('tr');

	{
		var td = document.createElement('td');

		td.appendChild(document.createTextNode('Actions'));
		td.className = "ws_border";
		tr.appendChild(td);
	}

	for (var col in fields)
	{
		var td = document.createElement('td');

		td.appendChild(document.createTextNode(fields[col]));
		td.className = "ws_border";
		tr.appendChild(td);
	}
	tr.className = "header";

	table.className = "ws_border";
	table.setAttribute('width', '100%');

	table.appendChild(tr);
	return table;
}

function webshark_create_tap_stat(table, stats, level)
{
	for (var i = 0; i < stats.length; i++)
	{
		var stat = stats[i];
		var val = stat['vals'];

		var tr = document.createElement('tr');

		tr.appendChild(webshark_create_tap_action_common(stat));

		for (var col in m_webshark_stat_fields)
		{
			var value = stat[col];

			/* TODO, hide fields which are undefined for whole table */
			if (value == undefined)
				value = '-';
			else if (col == 'perc')
				value = value + '%';

			var td = document.createElement('td');
			td.appendChild(document.createTextNode(value));
			tr.appendChild(td);
			td.className = "ws_border";
		}

		{
			var td = document.createElement('td');
			td.appendChild(document.createTextNode(level));
			tr.appendChild(td);
		}

		table.appendChild(tr);

		if (stat['sub'])
			webshark_create_tap_stat(table, stat['sub'], level + 1);
	}
}

function webshark_render_tap(tap)
{
	if (tap['type'] == 'stats')
	{
		var table = webshark_create_tap_table_common(m_webshark_stat_fields);

		webshark_create_tap_stat(table, tap['stats'], 0);

		document.getElementById('ws_tap_table').appendChild(window.webshark.dom_create_label("Stats TAP: " + tap['name']));
		document.getElementById('ws_tap_table').appendChild(table);

		var svg = d3.select("body").append("svg").remove()
				.attr("style", 'border: 1px solid black;');

		var tg_stat = tap['stats'][0];

//		TODO: generate more graphs tg_stat = tg_stat['sub'][0];

		window.webshark.webshark_d3_chart(svg, tg_stat['sub'],
		{
			title: tg_stat['name'],
			mwidth: 800, iwidth: 50, height: 400,

			getX: function(d) { return d['name'] },

			unit1: '%',
			scale1: [ tg_stat['count'] ],

			series1:
			[
				function(d) { return d['count']; }
			],

			color: [ 'steelblue' ]
		});

		document.getElementById('ws_tap_graph').appendChild(svg.node());
	}
	else if (tap['type'] == 'conv')
	{
		var table = webshark_create_tap_table_common(m_webshark_conv_fields);
		var convs = tap['convs'];

		for (var i = 0; i < convs.length; i++)
		{
			var conv = convs[i];

			if (conv['sport'])
			{
				conv['_sname'] = conv['saddr'] + ':' + conv['sport'];
				conv['_dname'] = conv['daddr'] + ':' + conv['dport'];
			}
			else
			{
				conv['_sname'] = conv['saddr'];
				conv['_dname'] = conv['daddr'];
			}

			conv['_name'] = conv['_sname'] + " <===>" + conv['_dname'];

			conv['_packets']  = conv['rxf'] + conv['txf'];
			conv['_bytes']    = conv['rxb'] + conv['txb'];
			conv['_duration'] = conv['stop'] - conv['start'];
			conv['_rate_tx'] = (8 * conv['txb']) / conv['_duration'];
			conv['_rate_rx'] = (8 * conv['rxb']) / conv['_duration'];

			conv['_filter'] = conv['filter'];
		}

		webshark_create_tap_table_data_common(m_webshark_conv_fields, table, convs);
		if (tap['geoip'] == true)
		{
			/* From http://dev.maxmind.com/geoip/geoip2/geolite2/ */
			var p = document.createElement('p');
			p.innerHTML = 'Webshark includes GeoLite2 data created by MaxMind, available from <a href="http://www.maxmind.com">http://www.maxmind.com</a>.';

			document.getElementById('ws_tap_table').appendChild(p);

			var link = "ipmap.html#" + window.btoa(JSON.stringify({'c': convs}));
			var iframe = document.createElement('iframe');
			iframe.frameBorder = 0;
			iframe.setAttribute("src", link);
			iframe.height = "100%";
			iframe.width = "100%";

			document.getElementById('ws_tap_extra').style.display = 'block';
			document.getElementById('ws_tap_extra').appendChild(iframe);
		}

		document.getElementById('ws_tap_table').appendChild(window.webshark.dom_create_label(tap['proto'] + ' Conversations (' + convs.length + ')'));
		document.getElementById('ws_tap_table').appendChild(table);

		var svg = d3.select("body").append("svg").remove()
				.attr("style", 'border: 1px solid black;');

		window.webshark.webshark_d3_chart(svg, convs,
		{
			title: tap['proto'] + ' Conversations - Frames Count',
			mwidth: 500, iwidth: 220, height: 400,

			getX: function(d) { return d['_name']; },

			series2:
			[
				function(d) { return d['rxf']; },
				function(d) { return d['txf']; }
			],

			color: [ '#d62728', '#2ca02c' ],
			// color: [ '#e377c2', '#bcbd22' ],
		});

		document.getElementById('ws_tap_graph').appendChild(svg.node());

		var svg = d3.select("body").append("svg").remove()
				.attr("style", 'border: 1px solid black;');

		window.webshark.webshark_d3_chart(svg, convs,
		{
			title: tap['proto'] + ' Conversations - Bytes Count',
			mwidth: 500, iwidth: 220, height: 400,

			getX: function(d) { return d['_name']; },

			series1:
			[
				function(d) { return d['rxb']; },
				function(d) { return d['txb']; }
			],

			color: [ '#d62728', '#2ca02c' ],
		});

		document.getElementById('ws_tap_graph').appendChild(svg.node());

	}
	else if (tap['type'] == 'host')
	{
		var host_fields = (tap['geoip'] == true) ? m_webshark_host_fields_geo : m_webshark_host_fields;

		var table = webshark_create_tap_table_common(host_fields);
		var hosts = tap['hosts'];

		for (var i = 0; i < hosts.length; i++)
		{
			var host = hosts[i];
			if (host['port'])
				host['_name'] = host['host'] + ':' + host['port'];
			else
				host['_name'] = host['host'];

			host['_packets']  = host['rxf'] + host['txf'];
			host['_bytes']    = host['rxb'] + host['txb'];
			host['_filter']   = host['filter'];
		}

		webshark_create_tap_table_data_common(host_fields, table, hosts);

		document.getElementById('ws_tap_table').appendChild(window.webshark.dom_create_label(tap['proto'] + ' Endpoints (' + hosts.length + ')'));
		if (tap['geoip'] == true)
		{
			/* From http://dev.maxmind.com/geoip/geoip2/geolite2/ */
			var p = document.createElement('p');
			p.innerHTML = 'Webshark includes GeoLite2 data created by MaxMind, available from <a href="http://www.maxmind.com">http://www.maxmind.com</a>.';

			document.getElementById('ws_tap_table').appendChild(p);

			var link = "ipmap.html#" + window.btoa(JSON.stringify({'h': hosts}));
			var iframe = document.createElement('iframe');
			iframe.frameBorder = 0;
			iframe.setAttribute("src", link);
			iframe.height = "100%";
			iframe.width = "100%";

			document.getElementById('ws_tap_extra').style.display = 'block';
			document.getElementById('ws_tap_extra').appendChild(iframe);
		}

		document.getElementById('ws_tap_table').appendChild(table);

		var svg = d3.select("body").append("svg").remove()
				.attr("style", 'border: 1px solid black;');

		window.webshark.webshark_d3_chart(svg, hosts,
		{
			title: tap['proto'] + ' Endpoints - Frames Count',
			mwidth: 400, iwidth: 110, height: 400,

			getX: function(d) { return d['_name']; },

			series2:
			[
				function(d) { return d['rxf']; },
				function(d) { return d['txf']; }
			],

			color: [ '#d62728', '#2ca02c' ],
			// color: [ '#e377c2', '#bcbd22' ],
		});

		document.getElementById('ws_tap_graph').appendChild(svg.node());

		var svg = d3.select("body").append("svg").remove()
				.attr("style", 'border: 1px solid black;');

		window.webshark.webshark_d3_chart(svg, hosts,
		{
			title: tap['proto'] + ' Endpoints - Bytes Count',
			mwidth: 400, iwidth: 110, height: 400,

			getX: function(d) { return d['_name']; },

			series1:
			[
				function(d) { return d['rxb']; },
				function(d) { return d['txb']; }
			],

			color: [ '#d62728', '#2ca02c' ],
		});

		document.getElementById('ws_tap_graph').appendChild(svg.node());
	}
	else if (tap['type'] == 'flow')
	{
		var webshark_tap_flow = require("./webshark-tap-flow.js");

		webshark_tap_flow.tap_report(tap);
	}
	else if (tap['type'] == 'nstat')
	{
		var nstat_fields = tap['fields'];
		var nstat_tables = tap['tables'];

		var fields = { };

		for (var i = 0; i < nstat_fields.length; i++)
		{
			fields['' + i] = nstat_fields[i]['c'];
		}

		for (var i = 0; i < nstat_tables.length; i++)
		{
			var nstat_table = tap['tables'][i];

			var table = webshark_create_tap_table_common(fields);

			webshark_create_tap_table_data_common(fields, table, nstat_table['i']);

			document.getElementById('ws_tap_table').appendChild(window.webshark.dom_create_label('Statistics (' + nstat_table['t'] + ') '));

			document.getElementById('ws_tap_table').appendChild(table);
		}

	}
	else if (tap['type'] == 'rtd')
	{
		var table = webshark_create_tap_table_common(m_webshark_rtd_fields);

		var rtd_stats = tap['stats'];

		for (var i = 0; i < rtd_stats.length; i++)
		{
			var row = rtd_stats[i];

			row['_min'] = prec_trunc(100, row['min'] * 1000.0);
			row['_max'] = prec_trunc(100, row['max'] * 1000.0);
			row['_avg'] = prec_trunc(100, (row['tot'] / row['num']) * 1000.0);

			/* TODO: calculate % if row['open_req'] */
		}

		webshark_create_tap_table_data_common(m_webshark_rtd_fields, table, rtd_stats);

		document.getElementById('ws_tap_table').appendChild(window.webshark.dom_create_label('Response Time Delay (' + tap['tap'] + ') '));

		if (tap['open_req'] != undefined)
		{
			var rdiv = document.createElement('div');
			rdiv.appendChild(dom_create_label_span("Open Requests: " + tap['open_req']));
			rdiv.appendChild(dom_create_label_span(", Discarded Responses: " + tap['disc_rsp']));
			rdiv.appendChild(dom_create_label_span(", Duplicated Requests: " + tap['req_dup']));
			rdiv.appendChild(dom_create_label_span(", Duplicated Responses: " + tap['rsp_dup']));

			document.getElementById('ws_tap_table').appendChild(rdiv);
		}

		document.getElementById('ws_tap_table').appendChild(table);

	}
	else if (tap['type'] == 'srt')
	{
		var srt_tables = tap['tables'];

		for (var i = 0; i < srt_tables.length; i++)
		{
			var rows = srt_tables[i]['r'];
			var filter = srt_tables[i]['f'];

			var table = webshark_create_tap_table_common(m_webshark_srt_fields);

			for (var j = 0; j < rows.length; j++)
			{
				var row = rows[j];

				row['_min'] = prec_trunc(100, row['min'] * 1000.0);
				row['_max'] = prec_trunc(100, row['max'] * 1000.0);
				row['_avg'] = prec_trunc(100, (row['tot'] / row['num']) * 1000);

				if (filter)
				{
					row['_filter'] = filter + ' == ' + row['idx'];
				}
			}

			webshark_create_tap_table_data_common(m_webshark_srt_fields, table, rows);

			document.getElementById('ws_tap_table').appendChild(window.webshark.dom_create_label('Service Response Time (' + tap['tap'] + ') ' + srt_tables[i]['n']));
			document.getElementById('ws_tap_table').appendChild(table);
		}
	}
	else if (tap['type'] == 'eo')
	{
		var table = webshark_create_tap_table_common(m_webshark_eo_fields);
		var objects = tap['objects'];

		webshark_create_tap_table_data_common(m_webshark_eo_fields, table, objects);

		document.getElementById('ws_tap_table').appendChild(window.webshark.dom_create_label("Export " + tap['proto'] + " object (" + objects.length + ')'));
		document.getElementById('ws_tap_table').appendChild(table);
	}
	else if (tap['type'] == 'voip-calls')
	{
		var table = webshark_create_tap_table_common(m_webshark_voip_calls_fields);
		var calls = tap['calls'];

		for (var i = 0; i < calls.length; i++)
		{
			var call = calls[i];

			/* TODO, generate comment for VOIP_ISUP, VOIP_H323 */

			call['_filter'] = call['filter'];
		}

		webshark_create_tap_table_data_common(m_webshark_voip_calls_fields, table, calls);

		document.getElementById('ws_tap_table').appendChild(window.webshark.dom_create_label("VoIP calls (" + calls.length + ')'));
		document.getElementById('ws_tap_table').appendChild(table);
	}
	else if (tap['type'] == 'expert')
	{
		var table = webshark_create_tap_table_common(m_webshark_expert_fields);
		var details = tap['details'];

		for (var i = 0; i < details.length; i++)
		{
			var item = details[i];

			if (item['s'])
			{
				item['_css_class'] = 'ws_cell_expert_color_' + item['s'];
			}

			item['_goto_frame'] = item['f'];
		}

		webshark_create_tap_table_data_common(m_webshark_expert_fields, table, details);

		document.getElementById('ws_tap_table').appendChild(window.webshark.dom_create_label("Expert information (" + details.length + ')'));
		document.getElementById('ws_tap_table').appendChild(table);
	}
	else if (tap['type'] == 'wlan')
	{
		var table = webshark_create_tap_table_common(m_webshark_wlan_fields);
		var list = tap['list'];

		list.sort(function(a, b)
		{
			var pkta = a['packets'], pktb = b['packets'];

			return pkta < pktb ? 1 : -1;
		});

		for (var i = 0; i < list.length; i++)
		{
			var item = list[i];

			item['_bssid']  = (item['bname'] ? item['bname'] : item['braw']);
			item['_filter'] = "wlan.bssid == " + item['braw'];
			item['_perc']  = prec_trunc(100, 100 * (item['packets'] / tap['packets'])) + '%';

			item['_wlan_extra_data'] = [ item['details'], item ];
		}

		webshark_create_tap_table_data_common(m_webshark_wlan_fields, table, list);

		document.getElementById('ws_tap_table').appendChild(window.webshark.dom_create_label("WLAN Traffic Statistics"));
		document.getElementById('ws_tap_table').appendChild(table);
	}
	else if (tap['type'] == 'fake-wlan-details')
	{
		var list = tap['items'];
		var orig_item = tap['orig_item'];

		var orig_item_packet_total = orig_item['packets'] - orig_item['t_beacon'];

		list.sort(function(a, b)
		{
			var pkta = a['packets'], pktb = b['packets'];

			return pkta < pktb ? 1 : -1;
		});

		for (var i = 0; i < list.length; i++)
		{
			var item = list[i];

			if (orig_item_packet_total)
				item['_perc'] = prec_trunc(100, 100 * (item['packets'] / orig_item_packet_total)) + '%';
			else
				item['_perc'] = prec_trunc(100, 0) + '%';

			if (item['araw'] == 'ff:ff:ff:ff:ff:ff')
				item['_comment'] = 'Broadcast';
			else if (orig_item['braw'] == item['araw'])
				item['_comment'] = 'Base station';
			else
				item['_comment'] = '';
		}

		var table = webshark_create_tap_table_common(m_webshark_wlan_details_fields);

		webshark_create_tap_table_data_common(m_webshark_wlan_details_fields, table, list);

		document.getElementById('ws_tap_table').appendChild(table);
	}
	else if (tap['type'] == 'rtp-streams')
	{
		var table = webshark_create_tap_table_common(m_webshark_rtp_streams_fields);
		var streams = tap['streams'];

		for (var i = 0; i < streams.length; i++)
		{
			var stream = streams[i];

			stream['_ssrc'] = "0x" + m_webshark_hexdump_module.xtoa(stream['ssrc'], 0);
			stream['_pb'] = stream['problem'] ? "X" : "";

			var lost = stream['expectednr'] - stream['totalnr'];

			stream['_lost'] = "" + lost + "(" + 100 * (lost / stream['expectednr']) + " %)";

			var ipstr = "ip";
			if (stream['ipver'] == 6) ipstr = "ipv6";

			var rtp_str = stream['saddr'] + '_' + stream['sport'] + '_' + stream['daddr'] + '_' + stream['dport'] + '_' + m_webshark_hexdump_module.xtoa(stream['ssrc'], 0);

			stream['_analyse'] = 'rtp-analyse:' + rtp_str;
			stream['_download'] = 'rtp:' + rtp_str;
			stream['_play'] = stream['_download'];
			stream['_play_descr'] = '[' + stream['saddr'] + ']:' + stream['sport'] + ' -> [' + stream['daddr'] + ']:' + stream['dport'] + " SSRC: " + stream['_ssrc'] + ' ' + stream['payload'];

			stream['_filter'] = "(" + ipstr + ".src == " + stream['saddr'] + " && udp.srcport == " + stream['sport'] + " && " +
			                          ipstr + ".dst == " + stream['daddr'] + " && udp.dstport == " + stream['dport'] + " && " +
			                          "rtp.ssrc == " + stream['_ssrc'] +
			                    ")";
		}

		var wave_div = document.createElement('div');
		wave_div.id = 'ws_rtp_playback';
		m_webshark_rtp_player_module.ws_rtp_playback_control_create(wave_div, null);

		webshark_create_tap_table_data_common(m_webshark_rtp_streams_fields, table, streams);

		document.getElementById('ws_tap_table').appendChild(window.webshark.dom_create_label("RTP streams (" + streams.length + ')'));
		document.getElementById('ws_tap_table').appendChild(table);
		document.getElementById('ws_tap_table').appendChild(wave_div);
	}
	else if (tap['type'] == 'rtp-analyse')
	{
		var table = webshark_create_tap_table_common(m_webshark_rtp_analyse_fields);
		var items = tap['items'];

		var rtp_str = "rtp:" + tap['tap'].slice(12);

		for (var i = 0; i < items.length; i++)
		{
			var item = items[i];

			item['_frame_time'] = item['f'] + ' (' + item['o'] + ')';
			item['_marker_str'] = (item['mark'] == 1) ? "Set" : "";

			if (item['s'])
				item['_status'] = item['s'];
			else
				item['_status'] = '[ OK ]';

			item['_rtp_goto'] = item['o'];
			item['_goto_frame'] = item['f'];
		}

		table['data_ws_rtp_name'] = rtp_str;

		m_webshark_rtp_player_module.set_in_table(rtp_str, [ items, table, null ]);
		webshark_create_tap_table_data_common(m_webshark_rtp_analyse_fields, table, items);

		document.getElementById('ws_tap_table').appendChild(window.webshark.dom_create_label("RTP analysis"));
		{
			var rdiv = document.createElement('div');

			rdiv.appendChild(dom_create_label_span("SSRC: 0x" + m_webshark_hexdump_module.xtoa(tap['ssrc'], 0)));

			rdiv.appendChild(dom_create_label_span(", Max Delta: " + tap['max_delta'] + ' ms @ ' + tap['max_delta_nr']));
			rdiv.appendChild(dom_create_label_span(", Max Jitter: " + tap['max_jitter'] + " ms"));
			rdiv.appendChild(dom_create_label_span(", Mean Jitter: " + tap['mean_jitter'] + " ms"));
			rdiv.appendChild(dom_create_label_span(", Max Skew: " + tap['max_skew'] + " ms"));
			rdiv.appendChild(dom_create_label_span(", RTP Packets: " + tap['total_nr']));
			rdiv.appendChild(dom_create_label_span(", Seq Errs: " + tap['seq_err']));
			rdiv.appendChild(dom_create_label_span(", Duration: " + prec_trunc(1000, tap['duration'] / 1000) + " s"));
			document.getElementById('ws_tap_table').appendChild(rdiv);
		}
		document.getElementById('ws_tap_table').appendChild(table);
	}
}

function webshark_load_tap(taps)
{
	var tap_req =
		{
			req: 'tap',
			capture: g_webshark_file
		};

	for (var i = 0; i < taps.length; i++)
		tap_req["tap" + i] = taps[i];

	window.webshark.webshark_json_get(tap_req,
		function(data)
		{
			for (var i = 0; i < data['taps'].length - 1; i++)
				webshark_render_tap(data['taps'][i]);
		});
}

exports.webshark_load_tap = webshark_load_tap;
