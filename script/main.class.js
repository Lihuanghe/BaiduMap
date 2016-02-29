var config = {
	initUrl :{
		getMapData : 'service/getData.json'
	},
};
(function( con, $, V, C, M){
	var view = new V(),
		control = new C(),
		model = new M(),
		mapCon = document.getElementById( 'map-container' );

	//初始化地图
	//model.initMap( c.mapConfig );
	$.ajax({
		url: con.initUrl.getMapData,
		type: 'GET',
		dataType: 'json',
		data: { },
		error:function(throwerror){

			console.log(throwerror);

		},
		success:function( data ){

			var totalData = '';

			totalData = view.pageList( data.d );

			view.loadData(totalData);

			view.pageNext(totalData);

			view.pagePrev(totalData);

			view.initMap( data.d );

		}
	})
	   $('#city_search').typeahead({
	      source: function(query, process) {
	      	
	         return cities;
	      },
	      matcher: function (item) {
	      	
	            return ~item.label.toLowerCase().indexOf(this.query.toLowerCase())
	      },
	      sorter: function (items) {
	            var beginswith = []
	              , caseSensitive = []
	              , caseInsensitive = []
	              , item

	            while (item = items.shift()) {
	              if (!item.label.toLowerCase().indexOf(this.query.toLowerCase())) beginswith.push(item)
	              else if (~item.label.indexOf(this.query)) caseSensitive.push(item)
	              else caseInsensitive.push(item)
	            }

	            return beginswith.concat(caseSensitive, caseInsensitive)
	         }	,
	        highlighter: function (item) {
	                var query = this.query.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, '\\$&')
	                return item.label.replace(new RegExp('(' + query + ')', 'ig'), function ($1, match) {
	                  return '<strong>' + match + '</strong>'
	                })
	          }	,
	          updater: function (item) {
		          	view.geocoder.getPoint(item.name,function(point){
					 	view.oMap.centerAndZoom( point, 12 );
					});
	               return item.name
	             }     
	   });
	
})( config, jQuery, View, Control, Model)