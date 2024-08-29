import mongoose from "mongoose";

// Define the AggregationPipeline class
class AggregationPipeline {
  constructor(queryParams, allowFields, defaultFields = []) {
    this.queryParams = queryParams;
    this.allowFields = allowFields;
    this.defaultFields = defaultFields;
    this.pipeline = [];
  }

  // Pagination
  pagination() {
    const { page = 1, size = 5 } = this.queryParams;
    const limit = Number(size);
    const skip = (page - 1) * limit;
    this.pipeline.push({ $skip: skip }, { $limit: limit });
    return this;
  }

  // Sort
  sort() {
    const { sort } = this.queryParams;
    if (sort) {
      const sortQuery = sort.split(",").reduce((acc, field) => {
        let direction = 1; // Default ascending sort
        if (field.startsWith("-")) {
          direction = -1; // Descending sort
          field = field.substring(1); // Remove the '-' character
        }
        if (this.allowFields.includes(field)) {
          acc[field] = direction;
        }
        return acc;
      }, {});

      if (Object.keys(sortQuery).length > 0) {
        this.pipeline.push({ $sort: sortQuery });
      }
    }
    return this;
  }

  // Search
  search() {
    const { search } = this.queryParams;
    let matchStage = {};
    if (search) {
      if (mongoose.Types.ObjectId.isValid(search)) {
        matchStage = { _id: mongoose.Types.ObjectId(search) };
      } else if (!isNaN(search)) {
        matchStage = {
          $or: this.allowFields
            .filter((field) => field.match(/Size$/))
            .map((field) => ({ [field]: Number(search) })),
        };
      } else {
        matchStage = {
          $or: this.allowFields
            .filter((field) => field.match(/name|Size$/))
            .map((field) => ({
              [field]: { $regex: new RegExp(search.trim(), "i") },
            })),
        };
      }
    }
    if (Object.keys(matchStage).length > 0) {
      this.pipeline.unshift({ $match: matchStage });
    } else {
      this.pipeline.unshift({ $match: {} }); // Add a default match stage
    }
    return this;
  }

  // Select
  select() {
    const { select } = this.queryParams;
    if (select) {
      const fields = select.split(",").reduce((acc, field) => {
        if (field.startsWith("-")) {
          const excludeField = field.substring(1);
          if (this.allowFields.includes(excludeField)) {
            acc[excludeField] = 0; // 0 means exclude in $project
          }
        } else if (this.allowFields.includes(field)) {
          acc[field] = 1; // 1 means include in $project
        }
        return acc;
      }, {});

      if (Object.keys(fields).length > 0) {
        this.pipeline.push({ $project: fields });
      }
    } else {
      // Include default fields if select is not provided
      const projectFields = this.defaultFields.reduce((acc, field) => {
        if (this.allowFields.includes(field)) {
          acc[field] = 1;
        }
        return acc;
      }, {});
      this.pipeline.push({ $project: projectFields });
    }
    return this;
  }

  // Slice operation for images
  sliceImages(limit = 7) {
    const { select } = this.queryParams;
    const imagesRequested =
      select &&
      select.split(",").includes("images") &&
      !select.split(",").includes("-images");

    const imagesDefaultAllowed =
      !select && this.defaultFields.includes("images");

    if (imagesRequested || imagesDefaultAllowed) {
      const projectStage = this.pipeline.find((stage) => stage.$project);
      if (projectStage) {
        if (projectStage.$project.images !== undefined) {
          // Apply $slice only if images field is included
          projectStage.$project.images = { $slice: ["$images", limit] };
        } else {
          // If images field is not included, add it separately with $slice
          this.pipeline.push({
            $project: { images: { $slice: ["$images", limit] } },
          });
        }
      } else {
        // If no $project stage, add it with images slice
        this.pipeline.push({
          $project: { images: { $slice: ["$images", limit] } },
        });
      }
    }
    return this;
  }

  // Filter
  filter() {
    const exclude = ["page", "size", "sort", "select", "search"];
    const filterQuery = {};
    Object.keys(this.queryParams).forEach((key) => {
      if (!exclude.includes(key)) {
        filterQuery[key] = this.queryParams[key];
      }
    });
    if (Object.keys(filterQuery).length > 0) {
      this.pipeline.push({
        $match: JSON.parse(
          JSON.stringify(filterQuery).replace(
            /gt|lt|gte|lte|regex|in|nin|neq|eq/g,
            (match) => `$${match}`
          )
        ),
      });
    }
    return this;
  }

  // Populate fields
  populate(path, selectFields = "") {
    const populateStage = {
      $lookup: {
        from: path,
        localField: "foreignKey", // Replace with actual foreign key
        foreignField: "_id",
        as: path,
      },
    };

    if (selectFields) {
      populateStage.$lookup.pipeline = [
        {
          $project: selectFields.split(",").reduce((acc, field) => {
            acc[field] = 1; // 1 means include in $project
            return acc;
          }, {}),
        },
      ];
    }

    this.pipeline.push(populateStage);
    return this;
  }

  // Build the pipeline
  build() {
    this.filter().search().select().sort().pagination();
    return this.pipeline;
  }
}

// Export the AggregationPipeline class
export default AggregationPipeline;
