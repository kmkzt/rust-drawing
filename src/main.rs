extern crate draw;

use draw::*;

fn main() {
    let mut canvas = Canvas::new(100, 100);

    // create a new drawing
    let rect = Drawing::new()
        // give it a shape
        .with_shape(Shape::Rectangle {
            width: 50,
            height: 50,
        })
        // move it around
        .with_xy(25.0, 25.0)
        // give it a cool style
        .with_style(Style::stroked(5, Color::black()));

    // add it to the canvas
    canvas.display_list.add(rect);

    // save the canvas as an svg
    render::save(
        &canvas,
        "tests/svg/basic_end_to_end.svg",
        SvgRenderer::new(),
    )
    .expect("Failed to save")
}

