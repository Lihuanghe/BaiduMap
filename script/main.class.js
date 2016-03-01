var config = {
	initUrl :{
		getMapData : 'data/0371.json'
	},
};
(function( con, $, V, C, M){
	var view = new V(),
		control = new C(),
		model = new M(),
		mapCon = document.getElementById( 'map-container' );

		var loadcitydata = function(url){
					//初始化地图
					//model.initMap( c.mapConfig );
					$.ajax({
						url: url,
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
					});
		};

		loadcitydata(config.initUrl.getMapData);

		$('#city_select').on('click',function(){
			var v = $('#city_search').val();
			view.geocoder.getPoint(v,function(point){
          		$('#latlng').text('经纬度：'+point.lng+','+point.lat)
			 	view.oMap.centerAndZoom( point, 16 );
			});
		});
	
	   $('#city_search').typeahead({
	      source: function(query, process) {
	         return Cities.cities;
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
		          		$('#latlng').text('经纬度：'+point.lng+','+point.lat)
					 	view.oMap.centerAndZoom( point, 12 );
					});
					var datafile = 'data/'+Cities.getzip(item.name)+'.json'

					loadcitydata(datafile);

	               return item.name
	             }     
	   });
	
})( config, jQuery, View, Control, Model)