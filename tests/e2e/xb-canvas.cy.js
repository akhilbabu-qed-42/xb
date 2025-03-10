describe('Experience Builder canvas controls/navigation', () => {
  before(() => {
    cy.drupalXbInstall();
  });

  beforeEach(() => {
    cy.drupalLogin('xbUser', 'xbUser');
  });

  after(() => {
    cy.drupalUninstall();
  });

  const roundValue = (value) => Math.round(value);

  it('Can zoom the canvas with the Zoom Controls', () => {
    cy.loadURLandWaitForXBLoaded();
    // Confirm that no component has a hover outline initially.
    cy.get('[data-xb-component-outline]').should('not.exist');

    // Hover over a component to trigger the outline and get its bounding rect.
    cy.getIframeBody()
      .find('[data-component-id="experience_builder:my-hero"] h1')
      .first()
      .then(($h1) => {
        const element = $h1;
        cy.wrap(element).trigger('mouseover');
        cy.wrap(element)
          .closest('[data-xb-uuid]')
          .then(($item) => {
            const rect = $item[0].getBoundingClientRect();
            cy.wrap(rect).as('initialComponentRect');
          });
      });

    // Verify the initial outline matches the component's size.
    cy.get('@initialComponentRect').then((initialComponentRect) => {
      cy.getComponentInPreview('Hero').should(($outline) => {
        expect($outline).to.exist;
        const outlineRect = $outline[0].getBoundingClientRect();
        expect(outlineRect.width).to.equal(initialComponentRect.width);
        expect(outlineRect.height).to.equal(initialComponentRect.height);
      });
    });

    cy.log('Zoom by clicking the buttons');
    cy.findByLabelText('Zoom in').click();
    cy.findByTestId('xb-canvas-scaling').should(
      'have.css',
      'transform',
      'matrix(1.1, 0, 0, 1.1, 0, 0)',
    );
    cy.findByText('110%');

    // Re-hover over the component after zoom change and get its new bounding rect.
    cy.getIframeBody()
      .find('[data-component-id="experience_builder:my-hero"] h1')
      .first()
      .then(($h1) => {
        cy.wrap($h1).trigger('mouseover');
        cy.wrap($h1)
          .closest('[data-xb-uuid]')
          .then(($item) => {
            // Calculate component height and width by scale value - as by default component's dimensions are not changing on zoom
            cy.getElementScaledDimensions($item[0]).then((dimensions) => {
              const zoomedComponentRect = $item[0].getBoundingClientRect();
              zoomedComponentRect.width = roundValue(dimensions.width);
              zoomedComponentRect.height = roundValue(dimensions.height);
              cy.wrap(zoomedComponentRect).as('zoomedComponentRect');
            });
          });
      });

    // Verify the outline matches the zoomed component's size.
    cy.get('@zoomedComponentRect').then((zoomedComponentRect) => {
      cy.getComponentInPreview('Hero').should(($outline) => {
        expect($outline).to.exist;
        const outlineRectAfterZoom = $outline[0].getBoundingClientRect();
        // Compare the outline dimensions with the zoomed component's dimensions.
        expect(roundValue(outlineRectAfterZoom.width)).to.equal(
          zoomedComponentRect.width,
        );
        expect(roundValue(outlineRectAfterZoom.height)).to.equal(
          zoomedComponentRect.height,
        );
      });
    });

    cy.findByLabelText('Zoom in').click();
    cy.findByTestId('xb-canvas-scaling').should(
      'have.css',
      'transform',
      'matrix(1.25, 0, 0, 1.25, 0, 0)',
    );
    cy.findByText('125%');
    cy.findByLabelText('Zoom out').click();

    // Re-hover over the component again after zoom-out.
    cy.getIframeBody()
      .find('[data-component-id="experience_builder:my-hero"] h1')
      .first()
      .then(($h1) => {
        cy.wrap($h1).trigger('mouseover', { force: true });
        cy.wrap($h1)
          .closest('[data-xb-uuid]')
          .then(($item) => {
            // Calculate component height and width by scale value - as by default component's dimensions are not changing on zoom
            cy.getElementScaledDimensions($item[0]).then((dimensions) => {
              const resetOutlineRect = $item[0].getBoundingClientRect();
              resetOutlineRect.width = roundValue(dimensions.width);
              resetOutlineRect.height = roundValue(dimensions.height);
              cy.wrap(resetOutlineRect).as('resetOutlineRect');
            });
          });
      });

    // Verify the outline size matches the original size after zoom-out.
    cy.get('@resetOutlineRect').then((resetOutlineRect) => {
      cy.getComponentInPreview('Hero').should(($outline) => {
        expect($outline).to.exist;
        const outlineRect = $outline[0].getBoundingClientRect();
        // Assert that the outline is equal to the size of the element after zoom-out (back to 100%).
        expect(roundValue(outlineRect.width)).to.equal(resetOutlineRect.width);
        expect(roundValue(outlineRect.height)).to.equal(
          resetOutlineRect.height,
        );
      });
    });
    cy.findByTestId('xb-canvas-scaling').should(
      'have.css',
      'transform',
      'matrix(1.1, 0, 0, 1.1, 0, 0)',
    );
    cy.findByText('110%');

    cy.log(
      "The selected value in the drop down should match the zoom level if it's one of the available steps",
    );
    cy.findByLabelText('Select zoom level').click();
    cy.findByTestId('zoom-select-menu')
      .get('[role="option"][aria-selected="true"]')
      .should('have.text', '110%');
    cy.get('html').click(); // close the select menu

    Array(4)
      .fill()
      .forEach(() => {
        cy.findByLabelText('Zoom out').click();
      });
    cy.findByTestId('xb-canvas-scaling').should(
      'have.css',
      'transform',
      'matrix(0.75, 0, 0, 0.75, 0, 0)',
    );
    cy.findByText('75%');

    cy.log('Zoom by adjusting the slider');
    cy.findByLabelText('Canvas zoom level').setRangeValue('200');
    cy.findByTestId('xb-canvas-scaling').should(
      'have.css',
      'transform',
      'matrix(2, 0, 0, 2, 0, 0)',
    );
    cy.findByText('200%');

    cy.findByLabelText('Canvas zoom level').setRangeValue('100');
    cy.findByTestId('xb-canvas-scaling').should(
      'have.css',
      'transform',
      'matrix(1, 0, 0, 1, 0, 0)',
    );
    cy.findByText('100%');

    cy.log(
      "The selected value in the drop down should match the zoom level if it's one of the available steps",
    );
    cy.findByLabelText('Select zoom level').click();
    cy.findByTestId('zoom-select-menu')
      .get('[role="option"][aria-selected="true"]')
      .should('have.text', '100%');
    cy.get('html').click(); // close the select menu

    cy.log(
      'Zoom to non-step zoom level and ensure nothing is selected in the drop down.',
    );
    cy.findByLabelText('Canvas zoom level').setRangeValue('101');
    cy.findByTestId('xb-canvas-scaling').should(
      'have.css',
      'transform',
      'matrix(1.01, 0, 0, 1.01, 0, 0)',
    );
    cy.findByText('101%');
    cy.findByLabelText('Select zoom level').click();
    cy.findByTestId('zoom-select-menu')
      .get('[role="option"][aria-selected="true"]')
      .should('not.exist');
    cy.get('html').click(); // close the select menu
  });

  it('Can zoom the canvas with the keyboard', () => {
    cy.loadURLandWaitForXBLoaded();

    cy.log('Zoom in by pressing + key');
    cy.get('html').realType('+');
    cy.findByTestId('xb-canvas-scaling').should(
      'have.css',
      'transform',
      'matrix(1.1, 0, 0, 1.1, 0, 0)',
    );
    cy.findByText('110%');

    cy.log(
      "The selected value in the drop down should match the zoom level if it's one of the available steps",
    );
    cy.findByLabelText('Select zoom level').click();
    cy.findByTestId('zoom-select-menu')
      .get('[role="option"][aria-selected="true"]')
      .should('have.text', '110%');
    cy.get('html').click(); // close the select menu

    cy.log('Zoom out by pressing - key (4 times)');
    cy.get('html').realType('----');
    cy.findByTestId('xb-canvas-scaling').should(
      'have.css',
      'transform',
      'matrix(0.75, 0, 0, 0.75, 0, 0)',
    );
    cy.findByText('75%');

    cy.log(
      "The selected value in the drop down should match the zoom level if it's one of the available steps",
    );
    cy.findByLabelText('Select zoom level').click();
    cy.findByTestId('zoom-select-menu')
      .get('[role="option"][aria-selected="true"]')
      .should('have.text', '75%');
    cy.get('html').click(); // close the select menu
  });

  it('Can zoom the canvas with the mouse', () => {
    cy.loadURLandWaitForXBLoaded();

    cy.log(
      'Zoom out by holding ctrl and using the mousewheel (or pinch on track pad)',
    );

    cy.findByTestId('xb-canvas').click({ force: true }); // Hold down the Control key
    cy.findByTestId('xb-canvas').triggerMouseWheelWithCtrl(-10); // Simulate mouse wheel roll

    cy.findByTestId('xb-canvas-scaling').should(
      'have.css',
      'transform',
      'matrix(1.1, 0, 0, 1.1, 0, 0)',
    );
    cy.findByText('110%');

    cy.log(
      'Zoom in by holding ctrl and using the mousewheel (or pinch on track pad)',
    );

    cy.findByTestId('xb-canvas').click({ force: true }); // Hold down the Control key
    cy.findByTestId('xb-canvas').triggerMouseWheelWithCtrl(20); // Simulate mouse wheel roll

    cy.findByTestId('xb-canvas-scaling').should(
      'have.css',
      'transform',
      'matrix(0.9, 0, 0, 0.9, 0, 0)',
    );
    cy.findByText('90%');
  });
});
