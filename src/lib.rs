use std::ops::{Add, Sub};
use std::option::Option;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
#[derive(Copy, Clone, Debug, PartialEq)]
struct Point {
    x: f32,
    y: f32,
}

#[wasm_bindgen]
#[derive(Copy, Clone, Debug, PartialEq)]
struct Vector {
    value: f32,
    angle: f32,
}

impl Vector {
    pub fn point(&self) -> Point {
        Point {
            x: self.angle.cos() * self.value,
            y: self.angle.sin() * self.value,
        }
    }

    pub fn scale(&self, s: f32) -> Self {
        Vector {
            angle: self.angle,
            value: self.value * s,
        }
    }
}

#[wasm_bindgen]
impl Point {
    pub fn new(x: f32, y: f32) -> Self {
        Point { x, y }
    }

    pub fn vector(&self, p: &Point) -> Vector {
        let v = p.sub(*self);
        Vector {
            value: (v.x.powf(2.0) + v.y.powf(2.0)).sqrt(),
            angle: v.y.atan2(v.x),
        }
    }

    pub fn scale(&self, r: f32) -> Self {
        Point {
            x: self.x * r,
            y: self.y * r,
        }
    }

    pub fn control(&self, v: &Vector) -> Self {
        v.point().add(*self)
    }
}

impl Add for Point {
    type Output = Self;

    fn add(self, other: Self) -> Self {
        Self {
            x: self.x + other.x,
            y: self.y + other.y,
        }
    }
}

impl Sub for Point {
    type Output = Point;

    fn sub(self, other: Point) -> Point {
        Point {
            x: self.x - other.x,
            y: self.y - other.y,
        }
    }
}

#[test]
fn test_point() {
    // vector
    {
        assert_eq!(
            Point::new(0.0, 0.0).vector(&Point::new(1.0, 1.0)),
            Vector {
                value: 1.4142135,
                angle: 0.7853982
            }
        );

        // TODO: Fix to convert Point { x: 1.0, y: 1.0 }
        assert_eq!(
            Vector {
                value: 1.4142135,
                angle: 0.7853982
            }
            .point(),
            Point {
                x: 0.99999994,
                y: 0.99999994
            }
        );
    }
    // control
    {
        let prev = Point { x: 1.0, y: 1.0 };
        let curr = Point { x: 2.0, y: 2.0 };
        let next = Point { x: 3.0, y: 1.0 };
        let vector = prev.vector(&next).scale(0.2);
        assert_eq!(curr.control(&vector), Point { x: 2.4, y: 2.0 });
    }
    // scale
    {
        assert_eq!(
            Point { x: 1.0, y: 1.0 }.scale(0.2),
            Point { x: 0.2, y: 0.2 }
        )
    }
}

// https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths
fn create_path(line: Vec<Point>, close: bool, circul: bool) -> String {
    const SMOOTH_RATIO: f32 = 0.2;
    let mut path_d = "".to_string();
    for (i, po) in line.iter().enumerate() {
        // Start
        if i == 0 {
            path_d.push_str(&format!("M {} {}", po.x, po.y));
            continue;
        }
        // Circuler
        if circul {
            // TODO: Fix frist and last point
            if i < 2 || i > line.len() - 2 {
                path_d.push_str(&format!(" L {} {}", po.x, po.y))
            } else {
                let p1 = line[i - 1];
                let p2 = line[i - 2];
                let n = line[i + 1];
                let cl = &p1.control(&p2.vector(&po).scale(SMOOTH_RATIO));
                let cr = &po.control(&n.vector(&p1).scale(SMOOTH_RATIO));
                path_d.push_str(&format!(
                    " C {} {} {} {} {} {}",
                    cl.x, cl.y, cr.x, cr.y, po.x, po.y
                ));
            }
            continue;
        }

        // Polygon
        path_d.push_str(&format!(" L {} {}", po.x, po.y))
    }

    if close {
        path_d.push_str(" Z");
    }

    path_d
}

#[test]
fn test_create_path() {
    // Polygon Mode
    assert_eq!(
        create_path(
            vec![
                Point { x: 0.0, y: 0.0 },
                Point { x: 1.0, y: 1.0 },
                Point { x: -1.0, y: -1.0 }
            ],
            true,
            false
        ),
        "M 0 0 L 1 1 L -1 -1 Z"
    );
}

// TODO: add fill, stroke, storke-width
#[wasm_bindgen]
#[derive(Clone, Debug, PartialEq)]
struct SvgPath {
    close: bool,
    circul: bool,
    d: Vec<Point>,
}

#[wasm_bindgen]
impl SvgPath {
    pub fn new(close: Option<bool>, circul: Option<bool>) -> Self {
        SvgPath {
            close: match close {
                Some(clo) => clo,
                None => false,
            },
            circul: match circul {
                Some(cir) => cir,
                None => false,
            },
            d: Vec::new(),
        }
    }

    #[wasm_bindgen(js_name=isCircul)]
    pub fn is_circul(&self) -> bool {
        self.circul
    }

    #[wasm_bindgen(js_name=toggleCircul)]
    pub fn toggle_circul(&mut self) {
        self.circul = !self.circul
    }

    #[wasm_bindgen(js_name=isClose)]
    pub fn is_close(&self) -> bool {
        self.close
    }

    #[wasm_bindgen(js_name=toggleClose)]
    pub fn toggle_close(&mut self) {
        self.close = !self.close
    }

    pub fn clear(&mut self) {
        self.d = Vec::new();
    }

    pub fn add(&mut self, point: Point) {
        self.d.push(point);
    }

    pub fn copy(&self) -> Self {
        self.clone()
    }

    pub fn to_string(&self) -> String {
        format!(
            "<path stroke=\"black\" stroke-width=\"1\" fill=\"transparent\" d=\"{}\" />",
            &create_path(self.d.to_vec(), self.close, self.circul)
        )
    }
}

#[test]
fn test_svgpath() {
    // Polygon Mode
    assert_eq!(
        create_path(
            vec![
                Point { x: 0.0, y: 0.0 },
                Point { x: 1.0, y: 1.0 },
                Point { x: -1.0, y: -1.0 }
            ],
            true,
            false
        ),
        "M 0 0 L 1 1 L -1 -1 Z"
    );
}

#[wasm_bindgen]
#[derive(Clone, Debug, PartialEq)]
struct SvgDrawing {
    width: u32,
    height: u32,
    paths: Vec<SvgPath>,
}

#[wasm_bindgen]
impl SvgDrawing {
    pub fn new(width: u32, height: u32) -> Self {
        SvgDrawing {
            width,
            height,
            paths: Vec::new(),
        }
    }

    pub fn clear(&mut self) {
        self.paths = Vec::new();
    }

    pub fn add(&mut self, path: SvgPath) {
        self.paths.push(path);
    }

    pub fn update(&mut self, path: SvgPath) {
        self.paths.pop();
        self.paths.push(path);
    }

    pub fn to_string(&self) -> String {
        let mut path_el = "".to_string();
        for p in self.paths.iter() {
            path_el.push_str(&p.to_string());
        }
        format!("<svg width=\"{}\" height=\"{}\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\">{}</svg>",self.width, self.height, path_el)
    }
}

impl Default for SvgDrawing {
    fn default() -> Self {
        SvgDrawing {
            width: 640,
            height: 480,
            paths: Vec::new(),
        }
    }
}
