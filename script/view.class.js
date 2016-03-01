(function(){
	var view = function( obj ){

		this.pageCount = 15; //每页展示数量

		this.oMap = null //BMap对象

		this.DataSet = obj || null; //

		this.currentPage = 1; // 当前显示页码

		this.totalPage = $('#totalpage'); //一共多少页码

		this.isPaint = false; //是否开启描点模式
		this.isMapfixed = false;

		this.prevPoly = ''; //上一次被查看的polygon

		this.singleDetail = document.getElementById('single-detail'); //form

		this.selfList = document.getElementById('self-list'); //列表

		this.deletePoint = document.getElementById('delete-point'); //删除上一坐标点

		this.deletePoints = document.getElementById('delete-points'); //删除坐标集

		this.oPolygon = {}; //内存保存polygon

		this.oMarker = {}; //内存保存Marker

		this.temporaryPolygon = {}; //临时的编辑区域

		this.mapclickhanler = null;

		this.geocoder = new BMap.Geocoder();

		this.selfIcon = new BMap.Icon('style/images/markers.png', new BMap.Size(19,25),{

			anchor: new BMap.Size( 10,25 ),

			imageOffset: new BMap.Size( -0, -(10*25) )
		}); //自定义icon图标

		this.mapConfig = {

			defaultCity: '重庆',

			defaultZoom: 12,

			defaultMapType: BMAP_NORMAL_MAP,

			defaultMapId: 'map-container',

			defaultPoints: new BMap.Point(113.638414,34.814921 ),

			maxZoom : 19,

			minZoom : 3
		};

		this.polygonOp ={ 

			strokeColor: 'red',    //边线颜色

			fillColor: 'yellow',  //填充颜色

			strokeWeight: 2,    //边线的宽度

			strokeOpacity: 0.7,  //边线透明度

			fillOpacity: 0.3,    //填充的透明度

			strokeStyle: 'solid'   //边线的样式
		};

		this.polygonHOp = {

			strokeColor: 'red',    //边线颜色

			fillColor: 'yellow',  //填充颜色

			strokeWeight: 3,    //边线的宽度

			strokeOpacity: 0.7,  //边线透明度

			fillOpacity: 0.5,    //填充的透明度

			strokeStyle: 'solid'   //边线的样式
		}
	};
	view.prototype = {

		loadData:function(originData,index){

			var that = this,

				index = index || 0,

				dataCon = document.getElementById( 'datalist' ),

				tmpData = originData[index];

			$('.data-container').empty();

			$( dataCon ).tmpl( tmpData ).appendTo('.data-container');

		},
		saveEditData:function(){
			var that = this,
			savedata = document.getElementById('savedata'); //保存数据

			$(savedata).on('click', function(event) {
				var tmpdata  = that.temporaryPolygon['polygon'] 
				var curEditdom = that.temporaryPolygon['curEditdom'] ;
				curEditdom.attr('data-points',that.polygonToArray(tmpdata));
			});
		},
		backToList: function(){

			var that = this,

				returnList = document.getElementById('returnlist'); //返回

			$(returnList).on('click', function(event) {

				if(that.prevPoly) that.oMap.removeOverlay(that.prevPoly);

				if(that.temporaryPolygon['marker'])
					that.oMap.removeOverlay(that.temporaryPolygon['marker']);
				if(that.temporaryPolygon['polygon'])
					that.temporaryPolygon['polygon'].map(function(item,idx){
							that.oMap.removeOverlay(item);
						});

				that.oMap.reset();

				that.selfList.style.display = 'block';

				that.singleDetail.style.display = 'none';

				that.isPaint = false;
				



				$(that.deletePoint).unbind();
				$(that.deletePoints).unbind()
				that.oMap.removeEventListener('click', that.mapclickhanler )
				that.mapclickhanler = null


			});
		},
		selfHandle: function(obj,point,idx,ordata){ //dragend事件的处理处理程序

			if( point.nodeName.toLowerCase() == 'input' ) point.value = obj.point.lng + ',' + obj.point.lat;

			if( point.nodeName.toLowerCase() == 'textarea' ){

				ordata[idx].setPosition(new BMap.Point(obj.point.lng, obj.point.lat));

				point.value = View.prototype.polygonToArray(ordata);

			}

		},
		polygonToArray: function(obj){ //将Polygon类型转化为字符串,用“|”相隔

			var pointsArray = [],

				resultArray = '';

			if(obj){

				obj.map(function( elem,index) {
					
					pointsArray.push(elem.getPosition().lng + ',' + elem.getPosition().lat );

				})
			}

			resultArray = pointsArray.join('|');

			return resultArray;

		},
		paintPoint: function(obj,input,data){ //描点开始

			var that = obj;
			return that.mapClick.call(null, that, input, data);
		},
		mapClick: function(t,inp,da){  //地图点击事件

			var _that = t, //view对象
				_input = inp, //textarea
				_data = da; //临时的编辑区域
			if(!!!_that.mapclickhanler ){
				_that.mapclickhanler = function(event){

					if(_that.isPaint){

						var oMarker = new BMap.Marker( new BMap.Point( event.point.lng, event.point.lat ));

						var selfLabel = new BMap.Label( _data.length );

						selfLabel.setStyle( { display:'block', position:'absolute', padding: '5px', color: '#fff', backgroundColor:'transparent', border:'none',fontSize:'12px' } );

						if(_data.length >= 10) selfLabel.setOffset( new BMap.Size( -3,-1 ) );

						oMarker.setLabel(selfLabel);
						
						_that.oMap.addOverlay(oMarker);
						_data.push(oMarker);
						_input.value = _that.polygonToArray(_data);
						oMarker.enableDragging();
						_that.selfDragend( oMarker, _input, _data.length - 1, _data );
					}

				};

			_that.oMap.addEventListener('click', _that.mapclickhanler )
			}
			
			if(_input.value)
				_that.oMap.setViewport( _that.oMap.getViewport(_that._pointsToOverlay(_input.value)));
		},
		checkMap: function(){

			var that = this,

				schoolid = document.getElementById('schoolid'), //学校ID

				areadesc = document.getElementById('areadesc'), //划片

				schoolname = document.getElementById('schoolname'), //学校名称

				schoolpoint  = document.getElementById('schoolpoint'), //学校坐标

				areapoints = document.getElementById('areapoints'); //划片坐标集

			$('body').on('click', '.maplook', function(event) {

				var dataCon = $(this).parent('div'),

                    tmpPoint = dataCon.attr('data-point'),

					tmpPoints = dataCon.attr('data-points'),

					tmpId = dataCon.attr('data-id'),

					tmpTitle = dataCon.attr('data-title'),

					tmpArea = dataCon.attr('data-area');

				schoolid.value = tmpId;

				areadesc.value = tmpArea;

				schoolname.value = tmpTitle; 

				schoolpoint.value = tmpPoint;

				areapoints.value = tmpPoints;

				that.selfList.style.display = 'none';
			
				that.singleDetail.style.display = 'block';

				if(!tmpPoints){

					if(!tmpPoint) {
						that.geocoder.getPoint(tmpTitle,function(point){
							if(!!!point) return;
							console.log('经纬度：'+point.lng+','+point.lat)
							that.oMap.setCenter( new BMap.Point(point.lng, point.lat) );
						});
					}else{
						that.oMap.setCenter( new BMap.Point(tmpPoint.split(',')[0], tmpPoint.split(',')[1]) );
					}

					

				}else{

					var tmpPos = that._pointsToOverlay( tmpPoints ),

						pen = new BMap.Polygon( tmpPos, that.polygonHOp );

						if( that.prevPoly ) that.oMap.removeOverlay( that.prevPoly );

						that.oMap.setViewport( that.oMap.getViewport(pen.getPath()) );

						that.oMap.addOverlay( pen );

						that.prevPoly = pen;

				}	
			});
		},
		editMap: function(){

			var that = this,

				schoolid = document.getElementById('schoolid'), //学校ID

				areadesc = document.getElementById('areadesc'), //划片

				schoolname = document.getElementById('schoolname'), //学校名称

				schoolpoint  = document.getElementById('schoolpoint'), //学校坐标

				areapoints = document.getElementById('areapoints'); //划片坐标集
			
			$('body').on('click', '.mapedit', function(event) {

				var dataCon = $(this).parent('div'),

                    tmpPoint = dataCon.attr('data-point'),

					tmpPoints = dataCon.attr('data-points'),

					tmpId = dataCon.attr('data-id'),

					tmpTitle = dataCon.attr('data-title'),

					tmpArea = dataCon.attr('data-area'),

					markerIndex = 1;//坐标集开始坐标index

				that.isPaint = true;

				that.temporaryPolygon['curEditdom'] = dataCon;
				that.temporaryPolygon['marker'] = '';

				that.temporaryPolygon['polygon'] = [];

				schoolid.value = tmpId;

				areadesc.value = tmpArea;

				schoolname.value = tmpTitle; 

				schoolpoint.value = tmpPoint;

				areapoints.value = tmpPoints;

				that.selfList.style.display = 'none';
			
				that.singleDetail.style.display = 'block';
				var showmarker = function(lng,lat){
					that.oMap.setCenter( new BMap.Point(lng,lat) );

					that.oMap.removeOverlay(that.oMarker[tmpId]); //删除原marker,增加到编辑区临时的marker

					var tmpPo = that._pointToOverlay(lng+","+lat); 

						mPen = new BMap.Marker(tmpPo,{icon:that.selfIcon}); //创建编辑时的marker 

					that.oMap.addOverlay(mPen);

					that.temporaryPolygon['marker'] = mPen;

					mPen.enableDragging();

					that.selfDragend(mPen,schoolpoint);
				}

				if(tmpPoint){
					showmarker(tmpPoint.split(',')[0], tmpPoint.split(',')[1]);

				}else{
					that.geocoder.getPoint(tmpTitle,function(point){
						if(point){
							console.log('经纬度：'+point.lng+','+point.lat)
							showmarker(point.lng,point.lat);
						}
					});
				}

				if(tmpPoints){

					var tmpPos = that._pointsToOverlay( tmpPoints ),

						pen = new BMap.Polygon( tmpPos, that.polygonHOp ),

						oldPlo = that.oPolygon[tmpId];

					that.oMap.removeOverlay(oldPlo);

					tmpPos.map(function( elem,index) {

						var oMarker = new BMap.Marker(elem);

						var selfLabel = new BMap.Label( index );

						selfLabel.setStyle( { display:'block', position:'absolute', padding: '5px', color: '#fff', backgroundColor:'transparent', border:'none',fontSize:'12px' } );

						if(index >= 10) selfLabel.setOffset( new BMap.Size( -3,-1 ) );

						oMarker.setLabel(selfLabel);
						
						that.oMap.addOverlay(oMarker);

						oMarker.enableDragging();

						that.temporaryPolygon['polygon'].push(oMarker);

						that.selfDragend( oMarker, areapoints, index, that.temporaryPolygon['polygon'] );

					})

				}


				that.paintPoint(that, areapoints, that.temporaryPolygon['polygon']);

				//清除上一个坐标点
				$(that.deletePoint).on('click', function(event) {
					
					var lastmarker = that.temporaryPolygon['polygon'].pop();
					if(lastmarker)
						that.oMap.removeOverlay(lastmarker);
					areapoints.value = that.polygonToArray(that.temporaryPolygon['polygon']);
					
					event.preventDefault();
				});
				//清除坐标集
				$(that.deletePoints).on('click', function(event) {
					
					that.temporaryPolygon['polygon'].map(function(item,idx){
						that.oMap.removeOverlay(item);
					});

					that.temporaryPolygon['polygon'].length = 0
					areapoints.value = that.polygonToArray(that.temporaryPolygon['polygon']);
					event.preventDefault();
				});

				
				event.preventDefault();
			});

		},
		selfDragend: function( params,par1,par2,par3){ //封装dragend的事件

			var that = this;

			params.addEventListener('dragend', function(obj){

				return that.selfHandle.call(null, obj, par1, par2, par3);
			});
		},
		mapFixed: function(params){

			var  that = this;

			if(!params) return;

			var fixedMap = document.getElementById('fixedmap');

			$(fixedMap).on('click', function(event) {

				if(!that.isMapfixed){
					that.isMapfixed = true; //描点模式开启

					params.disableScrollWheelZoom();

					params.disableDoubleClickZoom();

					params.disableKeyboard();

					params.disableDragging();
					$(fixedMap).text('解除固定')

				}else{
					that.isMapfixed = false; //关闭描点模式

					params.enableDoubleClickZoom()

					params.enableDragging();

					params.enableKeyboard();

					params.enableScrollWheelZoom();
					$(fixedMap).text('固定地图')

				}
				event.preventDefault();
			});
		},
		pageList : function( obj ){

			var pageCount = this.pageCount,

				pageArray = [],

				x = 0;

			for( var i = 0, j; j = obj[ i ]; i++ ){

				if( i % pageCount == 0 ){

					pageArray[ x ] = [];

					x++;

				}

				pageArray[ x - 1 ].push( j );

			}

			this.totalPage.html(pageArray.length);

			return pageArray;
		},
		pageNext: function(params){

			var nextBtn = $('#mapnext'),
				that = this;
			nextBtn.unbind();
			nextBtn.on('click', function(event) {

				if(that.currentPage == that.totalPage.html()){

					nextBtn.addClass('disabled');

					return;
				}else{

					nextBtn.removeClass('disabled');

					$('#mapprev').removeClass('disabled');

					that.currentPage++;

					$('#current').html(that.currentPage);

					that.loadData(params,that.currentPage - 1);
				}
			});
		},
		pagePrev: function(params){

			var prevBtn =$('#mapprev'),
				that = this;
				prevBtn.unbind();
			prevBtn.on('click', function(event) {

				if(that.currentPage == 1){

					prevBtn.addClass('disabled');

					return;
				}else{
					prevBtn.removeClass('disabled');

					$('#mapnext').removeClass('disabled');

					that.currentPage--;

					$('#current').html(that.currentPage);

					that.loadData(params,that.currentPage - 1);
				}
			});
		},
		overlayPoly : function( obj, bool ){

			var that = this;

			if( obj ){

				var oLength = obj.length;

				for( var i = 0; i < oLength; i++ ){

					if( obj[i].points ){

						var oPoints = this._pointsToOverlay( obj[i].points ),

							pen  = new BMap.Polygon( oPoints, that.polygonOp );

						that.oMap.addOverlay( pen );
						
						that.oPolygon[obj[i].id] = pen;
					}
					if( obj[i].point ){

						var oPoint = this._pointToOverlay( obj[i].point ),

							mPen = new BMap.Marker( oPoint );
							
							var newInfoWindowfunc = function(title){
								return function(){
									this.openInfoWindow(new BMap.InfoWindow(title))
								}
							};
							
							mPen.addEventListener('mouseover',newInfoWindowfunc( obj[i].title));
							mPen.addEventListener('mouseout',function(){
								this.closeInfoWindow();
							});

						that.oMap.addOverlay( mPen );
						
						that.oMarker[obj[i].id] = mPen;
					}
				}
				
			}else{
				
			}
		},
		overlayMarker: function( obj, boolean ){

			var that = this;

			if( obj ){

				var mPen = new BMap.Marker( new BMap.Point( obj ) );



			}
		},
		_pointsToOverlay: function( obj ){
			var pointArray     =   [],
				points         =   obj.split( '|' ),
				pointsLength   =   points.length;

			for( var t = 0; t < pointsLength; t++ ){

				var str = points[t].split(',');

				pointArray.push( new BMap.Point( str[ 0 ], str[ 1 ] ) );

			}

			return pointArray;
		},
		_pointToOverlay: function( obj ){

			var	str = obj.split( ',' ),

			 	tmpPoint = new BMap.Point( str[ 0 ], str[ 1 ] );

			return tmpPoint;
		},
/*
		movetopolygon:function(pArr){
			var points = this._getRectPoint(pArr);
			var distance = this._getFlatternDistance(points[0],points[1],points[2],points[3]);
			var zoom = this._getZoomLevel(distance);
			this.oMap.centerAndZoom( new BMap.Point((points[0] + points[2])/2,(points[1] + points[3])/2), zoom );
		},
		_getZoomLevel : function(distance){
			if(distance > 10000000)	return 3;
			if(distance > 5000000) return 4;
			if(distance > 2500000) return 5;
			if(distance > 1000000) return 6;
			if(distance > 500000) return 7;
			if(distance > 250000) return 8;
			if(distance > 125000) return 9;
			if(distance > 100000) return 10;
			if(distance > 50000) return 11;
			if(distance > 25000) return 12;
			if(distance > 10000) return 13;
			if(distance > 5000) return 14;
			if(distance > 2500) return 15;
			if(distance > 1000) return 16;
			if(distance > 500) return 17;
			if(distance > 250) return 18;
			if(distance > 100) return 19;
		},
		_getRectPoint: function(pArr){
			var top,left, bottom,right;
			
			if(pArr){
				top = pArr[1].getPosition().lng;
				bottom = pArr[1].getPosition().lng;
				left = pArr[1].getPosition().lat;
				right = pArr[1].getPosition().lat;
				pArr.map(function( elem,index) {
					if(top < elem.getPosition().lng) top=elem.getPosition().lng;
					if(bottom > elem.getPosition().lng) bottom = elem.getPosition().lng;
					
					if(left > elem.getPosition().lat )left = elem.getPosition().lat;
					if(right < elem.getPosition().lat ) right = elem.getPosition().lat;
					
				})
				return [left,top,right,bottom]
			}
			return ;
		},


     _getFlatternDistance : function(lat1,lng1,lat2,lng2){
		var EARTH_RADIUS = 6378137.0;    //单位M
		var PI = Math.PI;
		
		var getRad=function(d){
			return d*PI/180.0;
		}
		 
        var f = getRad((lat1 + lat2)/2);
        var g = getRad((lat1 - lat2)/2);
        var l = getRad((lng1 - lng2)/2);
        
        var sg = Math.sin(g);
        var sl = Math.sin(l);
        var sf = Math.sin(f);
        
        var s,c,w,r,d,h1,h2;
        var a = EARTH_RADIUS;
        var fl = 1/298.257;
        
        sg = sg*sg;
        sl = sl*sl;
        sf = sf*sf;
        
        s = sg*(1-sl) + (1-sf)*sl;
        c = (1-sg)*(1-sl) + sf*sl;
        
        w = Math.atan(Math.sqrt(s/c));
        r = Math.sqrt(s*c)/w;
        d = 2*w*a;
        h1 = (3*r -1)/2/c;
        h2 = (3*r +1)/2/s;
        
        return d*(1 + fl*(h1*sf*(1-sg) - h2*(1-sf)*sg));
    },
 */
		initMap : function( obj ){

			var that = this,

				mapPrev = $('#mapprev'), //上一页

				mapNext = $('#mapnext'); //下一页

			if(that.oMap) 
				return;
			that.oMap = new BMap.Map( that.mapConfig.defaultMapId );

			that.oMap.setMapType( that.mapConfig.defaultMapType );

			that.oMap.centerAndZoom( that.mapConfig.defaultPoints, that.mapConfig.defaultZoom );

			that.oMap.enableScrollWheelZoom();

			that.oMap.addControl( new BMap.NavigationControl() );

			that.oMap.enableKeyboard();

			//that.overlayPoly( obj, true );

			that.mapFixed( that.oMap );

			that.checkMap();

			that.editMap();

			that.backToList();
			that.saveEditData();
		}
	};
	window.View = view;
})()